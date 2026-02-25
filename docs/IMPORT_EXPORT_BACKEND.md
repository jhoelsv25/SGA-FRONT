# Importación / Exportación – contrato con el backend

## Resumen

- **Exportar**: el frontend genera el Excel en el cliente (con `xlsx`) y descarga. No requiere endpoint de export.
- **Importar**: el frontend sube el archivo, lo parsea y envía **JSON** al backend (`POST /students/import` o `POST /teachers/import` con body `{ rows: [...] }`). El backend no necesita parsear Excel; solo recibe el array y persiste.

Opcionalmente, el backend puede exponer un **ExcelService** común para generar archivos (por ejemplo reportes) recibiendo headers, columnas y datos.

---

## ExcelService en backend (esbozo)

Si quieres generar Excel en el servidor (reportes, export desde API), puedes crear un servicio común que reciba cabeceras y datos y devuelva el buffer del archivo.

### Ejemplo (NestJS con `exceljs`)

```bash
npm install exceljs
```

```ts
// common/services/excel.service.ts
import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

export type ExcelColumn = { key: string; label: string };

@Injectable()
export class ExcelService {
  /**
   * Genera un buffer .xlsx a partir de columnas y datos.
   * Útil para reportes y descargas desde el backend.
   */
  async generate(
    columns: ExcelColumn[],
    data: Record<string, unknown>[],
    sheetName = 'Datos',
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(sheetName, { headerFooter: { firstHeader: '' } });
    const headers = columns.map((c) => c.label);
    sheet.addRow(headers);
    const keys = columns.map((c) => c.key);
    data.forEach((row) => sheet.addRow(keys.map((k) => row[k] ?? '')));
    const buf = await workbook.xlsx.writeBuffer();
    return Buffer.from(buf);
  }

  /**
   * Genera plantilla solo con cabeceras (y opcional fila de ejemplo).
   */
  async generateTemplate(
    columns: ExcelColumn[],
    exampleRow?: Record<string, unknown>,
    sheetName = 'Plantilla',
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(sheetName);
    sheet.addRow(columns.map((c) => c.label));
    if (exampleRow) {
      sheet.addRow(columns.map((c) => exampleRow[c.key] ?? ''));
    }
    const buf = await workbook.xlsx.writeBuffer();
    return Buffer.from(buf);
  }
}
```

### Ejemplo de controlador que devuelve el archivo

```ts
// students.controller.ts (ejemplo)
@Get('export')
async export(@Res() res: Response) {
  const students = await this.studentsService.findAll();
  const columns = [
    { key: 'name', label: 'Nombre' },
    { key: 'email', label: 'Email' },
    { key: 'age', label: 'Edad' },
    { key: 'grade', label: 'Grado' },
  ];
  const buffer = await this.excelService.generate(columns, students, 'Estudiantes');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=estudiantes.xlsx');
  res.send(buffer);
}
```

En el frontend podrías llamar a `GET /students/export` y descargar la respuesta como archivo.

---

## Importación (recomendado: JSON desde frontend)

El frontend lee el Excel, valida filas y envía un array de objetos al backend.

### Estudiantes

- **Endpoint**: `POST /students/import`
- **Body**:
```json
{
  "rows": [
    { "name": "string", "email": "string", "age": number, "grade": "string" }
  ]
}
```
- **Respuesta**:
```json
{
  "created": number,
  "errors": [{ "row": number, "message": "string" }]
}
```

### Docentes

- **Endpoint**: `POST /teachers/import`
- **Body**:
```json
{
  "rows": [
    {
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "subject": "string",
      "hireDate": "string (ISO date)",
      "isActive": boolean
    }
  ]
}
```
- **Respuesta**: misma forma que estudiantes (`created`, `errors` opcional).

### Ventajas de recibir JSON

- El backend no depende de librerías Excel.
- Validación y lógica de negocio en un solo lugar.
- Fácil guardar un log de importación en JSONB si se desea (por ejemplo `import_log` con detalles por fila).

---

## Servicio Excel en backend (opcional)

Si en el backend se quieren generar reportes en Excel (por ejemplo desde un módulo común), se puede tener un servicio que reciba:

- `headers: string[]` (nombres de columnas)
- `data: Record<string, unknown>[]` (filas)

y devuelva el buffer del archivo `.xlsx` para que el cliente lo descargue. Ejemplo de firma (Node/Nest):

```ts
// excel.service.ts (backend, ej. en common/)
generateExcel(headers: string[], data: Record<string, unknown>[]): Buffer
```

Para **importar desde backend** (el cliente sube el archivo y el servidor lo parsea), el backend podría exponer `POST /students/import-file` con `multipart/form-data`, parsear el Excel en el servidor y luego guardar. La opción actual (frontend parsea y envía JSON) evita esa dependencia y mantiene un solo contrato (`/import` con JSON).

---

## Plantilla de carga

La plantilla se genera en el frontend al hacer clic en "Descargar plantilla". Contiene:

- Primera fila: cabeceras (Nombre, Email, Edad, Grado para estudiantes; Nombre, Apellido, Email, etc. para docentes).
- Opcionalmente una fila de ejemplo.

El usuario debe completar el archivo sin cambiar el nombre de las columnas (o usar exactamente la plantilla descargada).

---

## Tests antes de subir

Ejecutar antes de desplegar o de realizar importaciones masivas:

```bash
npm test
```

En el diálogo de importación se muestra el texto: *"Ejecute los tests del proyecto antes de importar en producción."*
