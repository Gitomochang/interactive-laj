// Define tile layers
const baseLayers = {
    osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }),
    hot: L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors, Tiles style by Humanitarian OpenStreetMap Team'
    }),
    cyclosm: L.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', {
        maxZoom: 20,
        attribution: '<a href="https://github.com/cyclosm/cyclosm-cartocss-style/releases" title="CyclOSM - Open Bicycle render">CyclOSM</a> | Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }),
    positron: L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }),
    dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }),
    gsi_std: L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '国土地理院'
    }),
    gsi_pale: L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '国土地理院'
    }),
    gsi_blank: L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/blank/{z}/{x}/{y}.png', {
        maxZoom: 14,
        attribution: '国土地理院'
    }),
    gsi_photo: L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg', {
        maxZoom: 18,
        attribution: '国土地理院'
    })
};

// Initialize map centered on Japan
const map = L.map('map', {
    center: [38.0, 137.0],
    zoom: 5,
    layers: [baseLayers.osm] // Default to OSM
});

let currentBaseLayer = baseLayers.osm;

// Initialize MarkerClusterGroup (used for high-density global views if ever restored)
const markers = L.markerClusterGroup({
    iconCreateFunction: function (cluster) {
        return L.divIcon({
            html: '<div><span>' + cluster.getChildCount() + '</span></div>',
            className: 'marker-cluster marker-cluster-small',
            iconSize: new L.Point(40, 40)
        });
    }
});

// Initialize LayerGroup for individual points (no clustering)
const individualPoints = L.layerGroup();

// Store loaded data globally
let allData = [];
let currentDrillDownWord = null;

// Function to render markers and list based on data
function renderMarkers(dataToRender, searchQuery = "") {
    markers.clearLayers();
    individualPoints.clearLayers();

    // Clear list
    const resultList = document.getElementById('resultList');
    resultList.innerHTML = '';

    const useColoring = document.getElementById('similarityColoring').checked;
    const selectedItem = document.getElementById('itemFilter').value;
    const query = searchQuery.toLowerCase();

    // Limit list rendering for performance if too many items
    const maxListItems = 100;
    let listCount = 0;
    const highlightedLatLngs = [];
    const seenWords = new Set();
    const uniqueForms = [];

    // If we are in drill-down mode, filter data for that word
    const isDrillDown = currentDrillDownWord !== null;

    // Header for drill-down mode
    if (isDrillDown) {
        const backBtn = document.createElement('div');
        backBtn.className = 'result-item';
        backBtn.style.textAlign = 'center';
        backBtn.style.background = '#eee';
        backBtn.style.fontWeight = 'bold';
        backBtn.style.cursor = 'pointer';
        backBtn.innerHTML = `← 「${currentDrillDownWord}」のまとめに戻る`;
        backBtn.onclick = () => {
            currentDrillDownWord = null;
            renderMarkers(dataToRender, searchQuery);
        };
        resultList.appendChild(backBtn);
    }

    dataToRender.forEach(item => {
        if (item.lat && item.lng) {
            const isMatch = !query ||
                (item.word && item.word.toLowerCase().includes(query)) ||
                (item.prefecture && item.prefecture.toLowerCase().includes(query));

            let marker;
            const color = (useColoring && item.hue !== undefined) ? `hsl(${item.hue}, 70%, 50%)` : "#3388ff";

            // If query exists, dim non-matches
            const opacity = isMatch ? 1 : 0.1;
            const fillOpacity = isMatch ? 0.8 : 0.05;

            marker = L.circleMarker([item.lat, item.lng], {
                radius: 4,
                fillColor: color,
                color: isMatch ? "#fff" : "transparent",
                weight: 1,
                opacity: opacity,
                fillOpacity: fillOpacity
            });

            // Create popup content
            const safeWord = item.word.replace(/'/g, "\\'");
            const countSuffix = item.count ? ` <span style="font-weight: normal; color: #888; font-size: 0.8em;">(${item.count}地点)</span>` : "";
            const popupContent = `
                <div style="font-size: 1.1em; font-weight: bold; margin-bottom: 5px;">${item.word}${countSuffix}</div>
                <div style="color: #666; font-size: 0.9em;">推定住所: ${item.address}</div>
                <div style="color: #888; font-size: 0.8em;">(元データ: ${item.prefecture})</div>
                <div style="font-size: 0.8em; margin-top: 5px; color: #888;">${item.item_name}</div>
                <div style="margin-top: 8px;">
                    <button onclick="setSearch('${safeWord}')" style="font-size: 0.8em; padding: 4px 8px; cursor: pointer;">この語形で検索</button>
                </div>
            `;

            marker.bindPopup(popupContent);

            // If it's a specific item view, use individual points. 
            // If it were a global view, we'd use markers (cluster).
            if (selectedItem) {
                individualPoints.addLayer(marker);
            } else {
                markers.addLayer(marker);
            }

            // Track search hits and collect unique forms for sidebar
            if (isMatch) {
                highlightedLatLngs.push([item.lat, item.lng]);

                if (!seenWords.has(item.word)) {
                    seenWords.add(item.word);
                    uniqueForms.push(item);
                }
            }
        }
    });

    // If in drill-down mode, just render all matching items for that word
    if (isDrillDown) {
        dataToRender.forEach(item => {
            if (item.word === currentDrillDownWord && listCount < maxListItems) {
                const li = document.createElement('div');
                li.className = 'result-item';
                const colorIndicator = (item.hue !== undefined) ? `hsl(${item.hue}, 70%, 50%)` : null;
                if (colorIndicator) {
                    li.style.borderLeft = `5px solid ${colorIndicator}`;
                }
                li.innerHTML = `
                    <div class="word">${item.word}</div>
                    <div class="meta">${item.prefecture} | ${item.address}</div>
                `;
                li.addEventListener('click', () => {
                    map.flyTo([item.lat, item.lng], 12);
                    const m = findMarkerAt(item.lat, item.lng);
                    if (m) m.openPopup();
                });
                resultList.appendChild(li);
                listCount++;
            }
        });
    } else {
        // Sort unique forms by frequency (count) descending
        uniqueForms.sort((a, b) => (b.count || 0) - (a.count || 0));

        // Render unique forms to sidebar
        uniqueForms.forEach(item => {
            if (listCount < maxListItems) {
                const li = document.createElement('div');
                li.className = 'result-item';
                const colorIndicator = (item.hue !== undefined) ? `hsl(${item.hue}, 70%, 50%)` : null;
                if (colorIndicator) {
                    li.style.borderLeft = `5px solid ${colorIndicator}`;
                }
                const sideCount = item.count ? `<span style="font-weight: normal; color: #aaa; font-size: 0.8em; margin-left: 5px;">(${item.count}地点)</span>` : "";
                li.innerHTML = `
                    <div class="word">${item.word}${sideCount}</div>
                    <div class="meta">${item.item_name}</div>
                    <div style="font-size: 0.7em; color: #ccc;">(ダブルクリックで詳細表示)</div>
                `;
                li.addEventListener('click', () => {
                    // When clicking a unique form, trigger a specific search for it
                    setSearch(item.word);
                });
                li.addEventListener('dblclick', () => {
                    currentDrillDownWord = item.word;
                    renderMarkers(dataToRender, searchQuery);
                });
                resultList.appendChild(li);
                listCount++;
            }
        });
    }

    const matchCount = highlightedLatLngs.length;
    const uniqueCount = seenWords.size;

    if (uniqueCount > maxListItems) {
        const more = document.createElement('div');
        more.style.padding = '10px';
        more.style.color = '#888';
        more.style.fontStyle = 'italic';
        more.textContent = `...他 ${uniqueCount - maxListItems} 種の語形`;
        resultList.appendChild(more);
    }

    // Toggle layer visibility
    if (selectedItem) {
        if (!map.hasLayer(individualPoints)) map.addLayer(individualPoints);
        map.removeLayer(markers);
    } else {
        if (!map.hasLayer(markers)) map.addLayer(markers);
        map.removeLayer(individualPoints);
    }

    document.getElementById('stats').textContent = `${uniqueCount} 種の語形 (${matchCount} 地点)`;

    if (highlightedLatLngs.length > 0) {
        const bounds = L.latLngBounds(highlightedLatLngs);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
}

// Helper to find a marker by coords
function findMarkerAt(lat, lng) {
    let found = null;
    individualPoints.eachLayer(layer => {
        if (layer.getLatLng().lat === lat && layer.getLatLng().lng === lng) {
            found = layer;
        }
    });
    if (found) return found;
    markers.eachLayer(layer => {
        if (layer.getLatLng().lat === lat && layer.getLatLng().lng === lng) {
            found = layer;
        }
    });
    return found;
}

function filterData() {
    currentDrillDownWord = null; // Reset drill down on new search/filter
    const query = searchInput.value.toLowerCase();
    const selectedItem = itemFilter.value;

    const itemData = allData.filter(item => item.item_name === selectedItem);
    renderMarkers(itemData, query);
}

// Modal handling
async function openReadme() {
    const modal = document.getElementById('readmeModal');
    const content = document.getElementById('readmeContent');
    modal.style.display = 'block';

    try {
        const response = await fetch('README.md');
        if (!response.ok) throw new Error('Failed to load README');
        const text = await response.ok ? await response.text() : "README.md が見つかりませんでした。";
        content.innerHTML = marked.parse(text);
    } catch (error) {
        console.error('Error loading README:', error);
        content.innerHTML = '<p style="color: red;">README.md の読み込みに失敗しました。</p>';
    }
}

function closeReadme() {
    document.getElementById('readmeModal').style.display = 'none';
}

// Event listeners
const searchInput = document.getElementById('searchInput');
const itemFilter = document.getElementById('itemFilter');
const similarityColoring = document.getElementById('similarityColoring');
const mapBackground = document.getElementById('mapBackground');
const openAboutBtn = document.getElementById('openAbout');
const closeModalBtn = document.getElementById('closeModal');
const readmeModal = document.getElementById('readmeModal');

searchInput.addEventListener('input', filterData);
itemFilter.addEventListener('change', filterData);
similarityColoring.addEventListener('change', filterData);

mapBackground.addEventListener('change', (e) => {
    const layer = baseLayers[e.target.value];
    if (layer) {
        map.removeLayer(currentBaseLayer);
        map.addLayer(layer);
        currentBaseLayer = layer;
    }
});

openAboutBtn.addEventListener('click', openReadme);
closeModalBtn.addEventListener('click', closeReadme);

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === readmeModal) {
        closeReadme();
    }
});

// Helper to set search from popup
window.setSearch = function (word) {
    searchInput.value = word;
    filterData();
    map.closePopup();
};


// Function to load and display data
async function loadData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allData = await response.json();

        const uniqueItems = [...new Set(allData.map(item => item.item_name).filter(n => n))].sort();
        uniqueItems.forEach(itemName => {
            const option = document.createElement('option');
            option.value = itemName;
            option.textContent = itemName;
            itemFilter.appendChild(option);
        });

        document.getElementById('stats').textContent = '項目を選択してください';

        // Set default item
        if (uniqueItems.includes('かたつむり（蝸牛）')) {
            itemFilter.value = 'かたつむり（蝸牛）';
            filterData();
        }

    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('stats').textContent = 'Error loading data. See console.';
    }
}

// Start loading
loadData();
