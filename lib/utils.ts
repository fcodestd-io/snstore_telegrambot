export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function formatRupiah(value: number | string): string {
  return Number(value).toLocaleString("id-ID");
}

// Telegram membatasi panjang pesan.
// Kita pecah berdasarkan paragraf agar pesan tidak terpotong sembarangan.
export function chunkText(text: string, max = 3500): string[] {
  if (text.length <= max) return [text];

  const output: string[] = [];
  let current = "";

  for (const part of text.split("\n\n")) {
    if (current && current.length + part.length + 2 > max) {
      output.push(current);
      current = "";
    }

    current += (current ? "\n\n" : "") + part;
  }

  if (current) {
    output.push(current);
  }

  return output;
}

// Ambil jumlah dari:
// "beli 2 canva"
// "2x spotify"
// "3 akun netflix"
//
// Angka durasi seperti "3 bulan" tidak dianggap quantity.
export function parseQuantity(text: string): number {
  const value = text.toLowerCase();

  const match =
    value.match(/\b(\d{1,2})\s*(?:x|akun|pcs|buah|unit)\b/) ||
    value.match(
      /\b(?:x|beli|order|pesan)\s*(\d{1,2})\b(?!\s*(?:bulan|bln|hari|minggu|tahun|thn))/,
    ) ||
    value.match(/^\s*(\d{1,2})\s+(?!bulan|bln|hari|minggu|tahun|thn)[a-z]/) ||
    value.match(/[a-z]\s+(\d{1,2})\s*$/);

  const quantity = match ? Number.parseInt(match[1], 10) : 1;

  return Math.min(Math.max(quantity, 1), 50);
}
