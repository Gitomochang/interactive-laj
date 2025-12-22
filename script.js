// Initialize map centered on Japan
const map = L.map('map').setView([38.0, 137.0], 5);

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Initialize MarkerClusterGroup
const markers = L.markerClusterGroup();

// Store loaded data globally
let allData = [];

// Function to render markers and list based on data
function renderMarkers(dataToRender) {
    markers.clearLayers();

    // Clear list
    const resultList = document.getElementById('resultList');
    resultList.innerHTML = '';

    // Limit list rendering for performance if too many items
    const maxListItems = 100;
    let listCount = 0;

    dataToRender.forEach(item => {
        if (item.lat && item.lng) {
            const marker = L.marker([item.lat, item.lng]);

            // Create popup content
            // Escape single quotes in word to avoid HTML attribute breaking
            const safeWord = item.word.replace(/'/g, "\\'");

            const popupContent = `
                <div style="font-size: 1.1em; font-weight: bold; margin-bottom: 5px;">${item.word}</div>
                <div style="color: #666; font-size: 0.9em;">推定住所: ${item.address}</div>
                <div style="color: #888; font-size: 0.8em;">(元データ: ${item.prefecture})</div>
                <div style="font-size: 0.8em; margin-top: 5px; color: #888;">${item.item_name}</div>
                <div style="margin-top: 8px;">
                    <button onclick="setSearch('${safeWord}')" style="font-size: 0.8em; padding: 4px 8px; cursor: pointer;">この語形で検索</button>
                </div>
            `;

            marker.bindPopup(popupContent);
            markers.addLayer(marker);

            // Add to sidebar list (limit to avoid freezing UI on huge datasets)
            if (listCount < maxListItems) {
                const li = document.createElement('div');
                li.className = 'result-item';
                li.innerHTML = `
                    <div class="word">${item.word}</div>
                    <div class="meta">${item.prefecture} | ${item.item_name}</div>
                    <div class="meta" style="font-size: 0.8em; color: #aaa;">${item.address}</div>
                `;
                li.addEventListener('click', () => {
                    // Zoom to marker
                    map.flyTo([item.lat, item.lng], 12);
                    // We need to find the specific marker layer to open it. 
                    // Since we aren't storing the marker reference in the data item, we can just open it here if visible
                    // Or purely relying on zoom is mostly enough for this UX.
                    // For clustering, opening popup inside cluster is tricky without spiderfying.
                    // Let's just zoom for now.
                    marker.openPopup();
                });
                resultList.appendChild(li);
                listCount++;
            }
        }
    });

    if (dataToRender.length > maxListItems) {
        const more = document.createElement('div');
        more.style.padding = '10px';
        more.style.color = '#888';
        more.style.fontStyle = 'italic';
        more.textContent = `...他 ${dataToRender.length - maxListItems} 件`;
        resultList.appendChild(more);
    }

    // Add cluster group to map if not already there
    if (!map.hasLayer(markers)) {
        map.addLayer(markers);
    }

    document.getElementById('stats').textContent = `${dataToRender.length} 件見つかりました`;

    // Zoom to fit bounds of filtered results
    if (dataToRender.length > 0) {
        // Collect all latlngs
        const latlngs = dataToRender
            .filter(item => item.lat && item.lng)
            .map(item => [item.lat, item.lng]);

        if (latlngs.length > 0) {
            const bounds = L.latLngBounds(latlngs);
            // Use a padding to avoid markers being on the edge
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
        }
    }
}

// Function to filter data
function filterData() {
    const query = searchInput.value.toLowerCase();
    const selectedItem = itemFilter.value;

    const filtered = allData.filter(item => {
        // Text Match
        const textMatch = !query ||
            (item.word && item.word.toLowerCase().includes(query)) ||
            (item.prefecture && item.prefecture.toLowerCase().includes(query));

        // Item Filter Match
        const itemMatch = !selectedItem || item.item_name === selectedItem;

        return textMatch && itemMatch;
    });

    renderMarkers(filtered);
}

// Event listeners
const searchInput = document.getElementById('searchInput');
const itemFilter = document.getElementById('itemFilter');

searchInput.addEventListener('input', filterData);
itemFilter.addEventListener('change', filterData);

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

        // Populate Item Filter
        const uniqueItems = [...new Set(allData.map(item => item.item_name).filter(n => n))].sort();
        uniqueItems.forEach(itemName => {
            const option = document.createElement('option');
            option.value = itemName;
            option.textContent = itemName;
            itemFilter.appendChild(option);
        });

        renderMarkers(allData);

        // Fit bounds if data exists
        if (allData.length > 0) {
            map.fitBounds(markers.getBounds());
            // Zoom out slightly if it's too zoomed in
            if (map.getZoom() > 10) {
                map.setZoom(10);
            }
        }

    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('stats').textContent = 'Error loading data. See console.';
    }
}

// Start loading
loadData();
