# 🗄️ Laboratorio de Datos — UJAP Split (Entrega 3)

> **Asignatura:** Tópicos Especiales de Programación Web  
> **Tema:** Modelado de datos: de tablas a documentos (PostgreSQL & NoSQL) — Clase 11  
> **Proyecto:** UJAP Split  

Este directorio contiene los artefactos de diseño, modelado relacional y modelado NoSQL solicitados en la **Clase 11 (Semana 11)** para el proyecto **UJAP Split**.

---

## 1. 📊 Diagrama Entidad-Relación (PostgreSQL)

El diagrama modela el corazón de datos completo de **UJAP Split**, cubriendo la relación $N:N$ obligatoria entre gastos y participantes, así como el catálogo de materiales y el sistema de pagos/abonos.

### Archivos:
- **Imagen del Diagrama:** `dbdiagram.jpeg` (generado y exportado desde [dbdiagram.io](https://dbdiagram.io))
- **Código Fuente DBML:** `modelo.dbml` (código fuente listo para importar o editar en dbdiagram.io)

### Entidades y Relaciones Modeladas:
1. **`usuario`** (1 a 1 / 1 a N con `companero`):
   - Cuentas de acceso al sistema con email único, contraseña y rol (`admin` o `usuario`).
2. **`companero`** (1 a N con `gasto` y `pago`):
   - Perfil de cada participante en el grupo de división de cuentas.
3. **`categoria`** (1 a N con `producto`):
   - Categorías temáticas de materiales (copias, papelería, equipos de laboratorio).
4. **`producto`** (1 a N con `gasto` opcional):
   - Artículos del catálogo universitario con precio positivo (`CHECK precio > 0`).
5. **`gasto`** (1 a N con `gasto_division`):
   - Registro principal de cada compra o gasto realizado, monto, fecha, tipo de división (`igual`, `porcentaje`, `exacto`) y quién lo pagó (`pagado_por_id`).
6. **`gasto_division`** (Tabla intermedia $N:N$):
   - Resuelve la relación de muchos a muchos entre `gasto` y `companero`, guardando la cuota o porcentaje asignado a cada participante. Clave primaria compuesta `(gasto_id, companero_id)`.
7. **`pago`**:
   - Registro de transferencias o abonos directos entre participantes (`de_id` $\rightarrow$ `para_id`) con referencia al gasto o liquidación global. Restricción `CHECK (de_id <> para_id)`.

---

## 2. 📝 Script DDL SQL (`esquema.sql`)

El archivo `esquema.sql` contiene la definición DDL compatible con **PostgreSQL**:
- Tablas creadas con tipos de datos estrictos (`VARCHAR`, `NUMERIC(12, 2)`, `SERIAL`, `DATE`, `TIMESTAMP`).
- Definición formal de claves primarias (`PRIMARY KEY`) y foráneas (`FOREIGN KEY`) con políticas de integridad referencial (`ON DELETE RESTRICT / CASCADE / SET NULL`).
- Restricciones de validación (`CHECK` para montos mayores a cero y tipos de división válidos).
- Índices de rendimiento (`CREATE INDEX`) sobre claves foráneas y columnas de filtrado frecuente (`categoria_id`, `pagado_por_id`, `fecha`).

### Ejecución en PostgreSQL:
```bash
psql -U postgres -d ujap_split -f esquema.sql
```

---

## 3. 🍃 Bonus NoSQL — Documentos MongoDB (`notificacion.mongodb.json`)

Siguiendo la consigna de la Clase 11:
> *"Elijan UNA parte de su proyecto que 'no encaje bien' en tablas (ej: notificaciones, logs, historial de búsquedas) y modélenla como un documento JSON estilo MongoDB."*

### Justificación Técnica:
Las notificaciones y eventos de actividad en **UJAP Split** (como alertas de nuevos gastos, recordatorios de cobro a deudores, o confirmaciones de pago) no encajan eficientemente en tablas rígidas de SQL por las siguientes razones:
1. **Esquema Polimórfico y Flexible:** Cada tipo de evento (`abono_deuda`, `nuevo_gasto_grupo`, `recordatorio_saldo_pendiente`) transporta datos contextuales distintos (unos incluyen listas de participantes, otros porcentajes de avance, otros días de retraso).
2. **Subdocumentos Anidados:** Permite agrupar en una sola lectura atómica los metadatos de auditoría (IP del dispositivo, agente de usuario), los datos del destinatario y el desglose de cuotas sin necesidad de ejecutar costosas operaciones de `JOIN`.
3. **Escalabilidad y Velocidad de Inserción:** Las notificaciones representan datos de alta frecuencia de escritura y lectura rápida ("feed" del usuario), ideales para el almacenamiento documental BSON en MongoDB.

El archivo `notificacion.mongodb.json` contiene ejemplos reales estructurados con tipos nativos de MongoDB (`$oid`, `$date`).
