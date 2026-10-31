# Medicine Datasets

This directory holds the raw medicine catalogue CSV datasets used for database seeding and catalogue imports.

Due to file sizes (~45 MB for `indian_medicine_master.csv`), raw CSV files are excluded from git tracking to keep the repository lightweight and fast to clone.

## How to download the dataset

To download the latest complete Indian Medicine master dataset, run:

```bash
npx tsx scripts/download-full-dataset.ts
```

This will automatically download and stream `indian_medicine_master.csv` directly into this folder.

## Importing to Database

After downloading, import the dataset into your Supabase / PostgreSQL database:

```bash
npx tsx scripts/import-all-medicines.ts
```
