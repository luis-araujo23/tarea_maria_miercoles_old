# ⚖️ Decisión Informada de ORM: Prisma vs Sequelize

> **Asignatura:** Tópicos Especiales de Programación Web  
> **Tema:** ORM: que tu código hable con la base de datos — Clase 12  
> **Proyecto:** UJAP Split  
> **Criterio Formativo (Clase 12):** *"Decisión de ORM justificada por el equipo"*  

---

## 1. Comparativa Técnica

De acuerdo con los lineamientos presentados en la Clase 12 (Slide 10), el equipo evaluó las dos alternativas principales de Object-Relational Mapping (ORM) para el ecosistema Node.js / TypeScript:

| Criterio | Prisma ORM | Sequelize ORM | Decisión UJAP Split |
| :--- | :--- | :--- | :--- |
| **Definición del Modelo** | Archivo único y declarativo `schema.prisma` (lenguaje específico de dominio intuitivo). | Clases y objetos definidos en archivos JavaScript / TypeScript dispersos. | **Prisma:** Centraliza el esquema de las 7 entidades en una sola fuente de verdad. |
| **Integración con TypeScript** | **Tipos generados automáticamente** desde el esquema (`@prisma/client`). Seguridad de tipos estricta y autocompletado en consultas y relaciones anidadas. | Soportado mediante decoradores o interfaces manuales, pero más propenso a desincronizaciones de tipos. | **Prisma:** Se acopla de forma nativa a la arquitectura TypeScript existente en el frontend y backend. |
| **Gestión de Relaciones** | Sintaxis declarativa `@relation` con soporte nativo para claves compuestas en tablas intermedias $N:N$ (`@@id([gastoId, companeroId])`). | Requiere configurar llamadas separadas a `belongsTo`, `hasMany` o `belongsToMany` en código de inicialización. | **Prisma:** El splitter de gastos requiere relaciones $N:N$ entre `Gasto` y `Companero`, las cuales se definen con suma claridad en Prisma. |
| **Migraciones de Base de Datos** | Integradas y automatizadas con `npx prisma migrate dev --name <nombre>`. Versionadas en Git. | Requiere herramientas adicionales (`sequelize-cli`), scripts manuales de migración (`up`/`down`). | **Prisma:** Migraciones consistentes y trazables en el flujo de trabajo de Git en equipo. |
| **Curva de Aprendizaje y Mantenibilidad** | Curva suave, API fluida y moderna (`prisma.gasto.findMany({ include: { divisiones: true } })`). | Mayor cantidad de conceptos que memorizar, sintaxis basada en operadores (`Op.like`, `Op.in`). | **Prisma:** Menor fricción de desarrollo y código más limpio en los controladores MVC. |
| **Madurez y Ecosistema** | Extremadamente activo, el estándar de facto en proyectos modernos con TypeScript y Vite/Next. | Veterano y con amplia trayectoria, pero con APIs heredadas de la era de callbacks/promesas tempranas. | **Prisma:** Proyecto preparado para la evaluación final integradora. |

---

## 2. Justificación Técnica de la Elección del Equipo

El equipo de **UJAP Split** seleccionó **Prisma ORM** como la herramienta de persistencia para el proyecto por los siguientes fundamentos de ingeniería:

1. **Alineación con TypeScript en todo el proyecto:**  
   Dado que todo el frontend y las interfaces de datos están fuertemente tipados en TypeScript, Prisma genera automáticamente los tipos para cada entidad (`Gasto`, `Companero`, `GastoDivision`, `Producto`, `Categoria`, `Pago`), evitando duplicidad de interfaces y eliminando discrepancias entre el esquema relacional y el código fuente.

2. **Modelado Óptimo de Relaciones Muchos a Muchos ($N:N$):**  
   El núcleo de negocio de **UJAP Split** es la división equitativa, porcentual o exacta de compras entre múltiples compañeros. Prisma permite modelar la tabla intermedia `GastoDivision` con clave primaria compuesta `(gastoId, companeroId)` y relaciones tipadas en una sola estructura limpia y comprensible.

3. **Facilidad de Migración y Despliegue Multi-Motor:**  
   Prisma permite alternar fácilmente entre SQLite (para desarrollo y pruebas locales sin dependencias de red o servicios pesados) y PostgreSQL (para entornos de base de datos relacional de producción), garantizando que el proyecto sea 100% reproducible en cualquier equipo docente.

---

## 3. Modelo del ORM en UJAP Split (`prisma/schema.prisma`)

Tal como se solicita en el **Slide 11 de la Clase 12**:
```prisma
model Gasto {
  id            Int             @id @default(autoincrement())
  descripcion   String
  monto         Float
  pagadoPorId   String          @map("pagado_por_id")
  pagadoPor     Companero       @relation("PagadoPor", fields: [pagadoPorId], references: [id])
  tipoDivision  String          @default("igual") @map("tipo_division")
  divisiones    GastoDivision[] // Relación N:N hacia participantes
  pagos         Pago[]
}

model GastoDivision {
  gastoId     Int       @map("gasto_id")
  gasto       Gasto     @relation(fields: [gastoId], references: [id], onDelete: Cascade)
  companeroId String    @map("companero_id")
  companero   Companero @relation(fields: [companeroId], references: [id])
  valor       Float

  @@id([gastoId, companeroId])
  @@map("gasto_division")
}
```

Esta estructura satisface completamente el requerimiento de la práctica de ORM y asegura la persistencia relacional íntegra del sistema.
