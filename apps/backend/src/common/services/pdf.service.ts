import { Injectable } from '@nestjs/common';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const PdfPrinter = require('pdfmake');

// Загружаем шрифты Roboto для поддержки кириллицы
// Если файлы шрифтов не найдены, используем стандартные шрифты PDF (будут проблемы с кириллицей)
let fonts: {
  Roboto: {
    normal: string | Buffer;
    bold: string | Buffer;
    italics: string | Buffer;
    bolditalics: string | Buffer;
  };
};

try {
  const fontsDir = join(__dirname, '..', 'fonts');
  const normalPath = join(fontsDir, 'Roboto-Regular.ttf');
  const boldPath = join(fontsDir, 'Roboto-Bold.ttf');
  const italicPath = join(fontsDir, 'Roboto-Italic.ttf');
  const boldItalicPath = join(fontsDir, 'Roboto-BoldItalic.ttf');

  if (
    existsSync(normalPath) &&
    existsSync(boldPath) &&
    existsSync(italicPath) &&
    existsSync(boldItalicPath)
  ) {
    fonts = {
      Roboto: {
        normal: readFileSync(normalPath),
        bold: readFileSync(boldPath),
        italics: readFileSync(italicPath),
        bolditalics: readFileSync(boldItalicPath),
      },
    };
  } else {
    throw new Error('Font files not found');
  }
} catch (error) {
  // Если файлы шрифтов не найдены, используем стандартные шрифты PDF
  // Это вызовет проблемы с кириллицей, но позволит системе работать
  fonts = {
    Roboto: {
      normal: 'Helvetica',
      bold: 'Helvetica-Bold',
      italics: 'Helvetica-Oblique',
      bolditalics: 'Helvetica-BoldOblique',
    },
  };
}

@Injectable()
export class PdfService {
  private printer = new PdfPrinter(fonts);

  async generatePdf(documentDefinition: TDocumentDefinitions): Promise<Buffer> {
    try {
      const pdfDoc = this.printer.createPdfKitDocument(documentDefinition);
      const chunks: Buffer[] = [];

      return new Promise<Buffer>((resolve, reject) => {
        pdfDoc.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        pdfDoc.on('end', () => {
          resolve(Buffer.concat(chunks));
        });

        pdfDoc.on('error', (error: Error) => {
          console.error('PDF generation error:', error);
          reject(error);
        });

        pdfDoc.end();
      });
    } catch (error) {
      console.error('PDF service error:', error);
      throw error;
    }
  }

  async generateInvoice(data: {
    invoiceNumber: string;
    date: string;
    clientName: string;
    clientAddress: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      total: number;
    }>;
    total: number;
  }): Promise<Buffer> {
    const tableBody: unknown[] = [
      [
        { text: 'Наименование', style: 'tableHeader' },
        { text: 'Количество', style: 'tableHeader', alignment: 'center' },
        { text: 'Цена', style: 'tableHeader', alignment: 'right' },
        { text: 'Сумма', style: 'tableHeader', alignment: 'right' },
      ],
      ...data.items.map((item) => [
        { text: item.name },
        { text: item.quantity.toString(), alignment: 'center' },
        { text: item.price.toFixed(2), alignment: 'right' },
        { text: item.total.toFixed(2), alignment: 'right' },
      ]),
      [
        { text: 'ИТОГО:', colSpan: 3, bold: true, alignment: 'right' },
        {},
        {},
        { text: data.total.toFixed(2), bold: true, alignment: 'right' },
      ],
    ];

    const documentDefinition: TDocumentDefinitions = {
      content: [
        { text: 'СЧЕТ НА ОПЛАТУ', style: 'header', alignment: 'center' },
        { text: `№ ${data.invoiceNumber}`, style: 'subheader', alignment: 'center' },
        { text: `Дата: ${data.date}`, style: 'subheader', alignment: 'center' },
        { text: '\n' },
        {
          columns: [
            {
              width: '*',
              text: [
                { text: 'Поставщик:\n', bold: true },
                { text: 'GreenCycle\n' },
                { text: 'Адрес: ул. Примерная, д. 1\n' },
                { text: 'ИНН: 1234567890\n' },
              ],
            },
            {
              width: '*',
              text: [
                { text: 'Покупатель:\n', bold: true },
                { text: `${data.clientName}\n` },
                { text: `${data.clientAddress}\n` },
              ],
            },
          ],
        },
        { text: '\n' },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto'],
            body: tableBody as never,
          },
        },
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 10],
        },
        subheader: {
          fontSize: 14,
          margin: [0, 10, 0, 5],
        },
        tableHeader: {
          bold: true,
          fontSize: 12,
          color: 'black',
          fillColor: '#eeeeee',
        },
      },
      defaultStyle: {
        font: 'Roboto',
        fontSize: 10,
      },
    };

    return this.generatePdf(documentDefinition);
  }

  async generateShipmentDocument(data: {
    shipmentNumber: string;
    date: string;
    supplierName: string;
    items: Array<{
      plantType: string;
      size: string;
      potType: string;
      quantity: number;
      price: number;
      total: number;
    }>;
    total: number;
  }): Promise<Buffer> {
    try {
      const tableBody: unknown[] = [
        [
          { text: 'Наименование', style: 'tableHeader' },
          { text: 'Размер', style: 'tableHeader', alignment: 'center' },
          { text: 'Горшок', style: 'tableHeader', alignment: 'center' },
          { text: 'Количество', style: 'tableHeader', alignment: 'center' },
          { text: 'Цена', style: 'tableHeader', alignment: 'right' },
        ],
        ...data.items.map((item) => [
          { text: item.plantType || '' },
          { text: item.size || '', alignment: 'center' },
          { text: item.potType || '', alignment: 'center' },
          { text: (item.quantity || 0).toString(), alignment: 'center' },
          { text: (item.price || 0).toFixed(2), alignment: 'right' },
        ]),
        [
          { text: 'ИТОГО:', colSpan: 4, bold: true, alignment: 'right' },
          {},
          {},
          {},
          { text: (data.total || 0).toFixed(2), bold: true, alignment: 'right' },
        ],
      ];

    const documentDefinition: TDocumentDefinitions = {
      content: [
        { text: 'НАКЛАДНАЯ', style: 'header', alignment: 'center' },
        { text: `№ ${data.shipmentNumber}`, style: 'subheader', alignment: 'center' },
        { text: `Дата: ${data.date}`, style: 'subheader', alignment: 'center' },
        { text: '\n' },
        {
          text: [
            { text: 'Поставщик: ', bold: true },
            { text: data.supplierName },
          ],
        },
        { text: '\n' },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto', 'auto'],
            body: tableBody as never,
          },
        },
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 10],
        },
        subheader: {
          fontSize: 14,
          margin: [0, 10, 0, 5],
        },
        tableHeader: {
          bold: true,
          fontSize: 12,
          color: 'black',
          fillColor: '#eeeeee',
        },
      },
      defaultStyle: {
        font: 'Roboto',
        fontSize: 10,
      },
    };

      return this.generatePdf(documentDefinition);
    } catch (error) {
      console.error('Error generating shipment document:', error);
      throw error;
    }
  }

  async generateBuybackAct(data: {
    actNumber: string;
    date: string;
    clientName: string;
    clientAddress: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      condition: string;
      total: number;
    }>;
    total: number;
  }): Promise<Buffer> {
    const tableBody: unknown[] = [
      [
        { text: 'Наименование', style: 'tableHeader' },
        { text: 'Количество', style: 'tableHeader', alignment: 'center' },
        { text: 'Состояние', style: 'tableHeader', alignment: 'center' },
        { text: 'Цена', style: 'tableHeader', alignment: 'right' },
        { text: 'Сумма', style: 'tableHeader', alignment: 'right' },
      ],
      ...data.items.map((item) => [
        { text: item.name },
        { text: item.quantity.toString(), alignment: 'center' },
        { text: item.condition || '-', alignment: 'center' },
        { text: item.price.toFixed(2), alignment: 'right' },
        { text: item.total.toFixed(2), alignment: 'right' },
      ]),
      [
        { text: 'ИТОГО:', colSpan: 4, bold: true, alignment: 'right' },
        {},
        {},
        {},
        { text: data.total.toFixed(2), bold: true, alignment: 'right' },
      ],
    ];

    const documentDefinition: TDocumentDefinitions = {
      content: [
        { text: 'АКТ ВЫКУПА', style: 'header', alignment: 'center' },
        { text: `№ ${data.actNumber}`, style: 'subheader', alignment: 'center' },
        { text: `Дата: ${data.date}`, style: 'subheader', alignment: 'center' },
        { text: '\n' },
        {
          columns: [
            {
              width: '*',
              text: [
                { text: 'Покупатель:\n', bold: true },
                { text: 'GreenCycle\n' },
                { text: 'Адрес: ул. Примерная, д. 1\n' },
                { text: 'ИНН: 1234567890\n' },
              ],
            },
            {
              width: '*',
              text: [
                { text: 'Продавец:\n', bold: true },
                { text: `${data.clientName}\n` },
                { text: `${data.clientAddress}\n` },
              ],
            },
          ],
        },
        { text: '\n' },
        {
          text: 'Настоящий акт удостоверяет, что покупатель принял, а продавец передал следующие товары:',
          margin: [0, 10, 0, 10],
        },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto', 'auto'],
            body: tableBody as never,
          },
        },
        { text: '\n' },
        {
          text: [
            { text: 'Покупатель: ', bold: true },
            { text: '____________________ (____________________)\n' },
            { text: 'Продавец: ', bold: true },
            { text: '____________________ (____________________)' },
          ],
          margin: [0, 20, 0, 0],
        },
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 10],
        },
        subheader: {
          fontSize: 14,
          margin: [0, 10, 0, 5],
        },
        tableHeader: {
          bold: true,
          fontSize: 12,
          color: 'black',
          fillColor: '#eeeeee',
        },
      },
      defaultStyle: {
        font: 'Roboto',
        fontSize: 10,
      },
    };

    return this.generatePdf(documentDefinition);
  }
}