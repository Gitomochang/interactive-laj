# Interactive LAJ (Interactive Linguistic Atlas of Japan)

「日本言語地図データベース（LAJDB）」のデータを可視化するインタラクティブな Web アプリケーションです。

## 主な機能

- **項目の絞り込み**: 調査項目（例：かたつむり）を選択し、その分布を日本地図上に表示します。
- **類似度カラーリング**: 筆者が**[Word Tour (Sato 2022)](https://doi.org/10.18653/v1/2022.naacl-main.157)** を語形データに適用した **[Form Tour](https://mottojapanese.com/2024/12/04/form-tour%ef%bc%9a%e5%b7%a1%e5%9b%9e%e3%82%bb%e3%83%bc%e3%83%ab%e3%82%b9%e3%83%9e%e3%83%b3%e5%95%8f%e9%a1%8c%e3%82%92%e8%a7%a3%e3%81%84%e3%81%a6%e8%aa%9e%e5%bd%a2%e3%81%ae%e4%b8%80%e6%ac%a1%e5%85%83/)** により、音韻的に似た響きの語形が近い色（Hue）になるよう自動的に色分けしています。語形から音韻素性ベクトルを生成し、巡回セールスマン問題（TSP）の解にカラーコードを対応させています。なお、語形データの埋め込み表現については[近藤・持橋 (2025)](https://www.anlp.jp/proceedings/annual_meeting/2025/pdf_dir/E2-5.pdf)で採用されている**Bag of Character**を参考に、それを音韻素性に拡張したもの（**[Bag of Feature](https://mottojapanese.com/2023/08/04/%e8%aa%9e%e5%bd%a2%e3%81%ae%e5%88%86%e9%a1%9e%e3%82%92%e8%87%aa%e5%8b%95%e5%8c%96%e3%81%97%e3%81%a6%e3%81%bf%e3%82%88%e3%81%86%ef%bc%81/)**）です。ただし、元論文とは異なり、単位はユニグラムのみです。
- **検索・ハイライト**: 語形や県名で検索ができます。該当する地点を強調し、それ以外を暗く表示（ディミング）することで、分布全体の中での位置付けを確認できます。
- **語形の要約表示**: サイドバーには、ヒットした語形が**出現頻度順**に重複なしでリストアップされます。各語形には合計地点数 `(〇〇地点)` が表示されます。
- **ドリルダウン（詳細表示）**: サイドバーの語形を**ダブルクリック**することで、その語形に該当する全地点の個別リストに切り替え、地点ごとの詳細を確認できます。
- **個別ピン表示**: 項目選択時にはクラスタリングを行わず、全ての地点を個別のサークルマーカーで表示し、微細な分布を観察しやすくしています。
- **マップ背景の切り替え**: OpenStreetMap（通常・HOT・CyclOSM）に加え、国土地理院の地図（標準・淡色・白地図・空中写真）や、データ可視化に最適な CartoDB (Positron/Dark) をプルダウンで切り替え可能です。

## 使い方

1.  [Interactive LAJ](https://gitomochang.github.io/interactive-laj/)にアクセスしてください。
2.  **項目の選択**: 左上のドロップダウンメニューから、表示したい項目を選択してください。
3.  **検索・絞り込み**: 検索ボックスに語形や県名を入力すると、該当地点がハイライトされます。
4.  **詳細の確認**: 
    - マップ上のマーカーをクリックすると、推定住所などの詳細が表示されます。
    - サイドバーの語形を**クリック**すると地図がその語形にズームします。
    - サイドバーの語形を**ダブルクリック**すると、その語形の個別地点一覧が表示されます。
5.  **マップ背景の切り替え**: 
    - サイドバーの「マップ背景」から背景地図を変更できます。
    - マーカーの視認性を高めたい場合や分布を際立たせたい場合は、「CartoDB (Positron - Clean)」や「地理院地図（白地図）」がおすすめです。


## 参考資料
- Sato, T. (2022). [Word Tour: One-dimensional Word Embeddings via the Traveling Salesman Problem](https://doi.org/10.18653/v1/2022.naacl-main.157). In *Proceedings of the 2022 Conference on North American Chapter of the Association for Computational Linguistics: Human Language Technologies*, pages 2150–2160.


## データ出典・利用条件

本アプリケーションは、以下のデータベースのデータを利用しています。

*   **出典**: 『日本言語地図』データベース (LAJDB)
*   **公式サイト**: [https://lajdb.org/](https://lajdb.org/)

## ライセンス

本アプリケーションのプログラムコード（HTML, JavaScript, CSS, etc.）は [MIT License](https://opensource.org/licenses/MIT) の下で公開されています。  
地図データ (`data.json`) の利用は[『日本言語地図』データベース (LAJDB)の利用条件](https://www.lajdb.org/lajdb_data/LAJDB_data_withCord_download002_v20180328_rev.html)に従ってください。

## 作成者

Tomoya NARITA <br> 
[naritatomoya.com](https://www.naritatomoya.com/)
