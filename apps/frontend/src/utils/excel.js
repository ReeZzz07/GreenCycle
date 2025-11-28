import * as XLSX from 'xlsx';
export function exportToExcel(data, filename, sheetName = 'Sheet1') {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${filename}.xlsx`);
}
export function exportReportsToExcel(data) {
    const workbook = XLSX.utils.book_new();
    data.forEach((sheet) => {
        const worksheet = XLSX.utils.json_to_sheet(sheet.data);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheet.sheetName);
    });
    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `reports-${date}.xlsx`);
}
