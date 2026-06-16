# Toysstore Stock Monitor

Dette er en lille GitHub Actions-monitor til:

https://toysstore.dk/shop/363-pokemon-kort/3518-pokemon-first-partner-illustration-collection-series-2/

Den tjekker produktet hvert 5. minut i GitHub, så din egen computer ikke behøver at være tændt.

## Sådan bruger du den

1. Lav et nyt repository på GitHub.
2. Upload/push filerne i denne mappe til repository'et.
3. Gå til **Actions** i GitHub og aktiver workflows, hvis GitHub beder om det.
4. Kør workflowet manuelt første gang via **Actions > Toysstore stock monitor > Run workflow**.

Monitoren gemmer seneste status i `data/state.json`. Når status går fra noget andet til `in_stock`, kan den sende en Discord-besked.

## Discord-besked

Hvis du vil have besked i Discord:

1. Opret en Discord webhook i den kanal, hvor beskeden skal komme.
2. Gå til GitHub repository'et.
3. Åbn **Settings > Secrets and variables > Actions**.
4. Opret en ny repository secret med navnet `DISCORD_WEBHOOK_URL`.
5. Indsæt webhook-URL'en som værdien.

Uden denne secret kører monitoren stadig, men den skriver kun status i GitHub Actions og `data/state.json`.

## Noter

- GitHub Actions' tidsplan er normalt tæt på hvert 5. minut, men GitHub kan forsinke jobs i travle perioder.
- Hvis Toysstore ændrer deres side, kan lagerdetektionen skulle justeres.
- Du kan altid trykke **Run workflow** manuelt for at tjekke med det samme.
