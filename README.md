# LUMA Centro Estético

Plataforma web para **LUMA Centro Estético**, un espacio de belleza en Montevideo. El proyecto combina una landing editorial con identidad visual propia, catálogo de servicios, reservas online, pagos y un panel administrativo protegido.

> Proyecto desarrollado como una aplicación real para gestionar la presencia digital y las reservas de LUMA.

## Funcionalidades

- Landing page responsive con secciones de presentación, servicios y contacto.
- Catálogo de categorías y tratamientos administrable desde base de datos.
- Reserva online con selección de servicio, fecha y horario.
- Validación de disponibilidad y prevención de superposición de turnos.
- Integración opcional con Mercado Pago para señas.
- Emails transaccionales y notificaciones mediante Resend.
- Panel de administración para:
  - consultar y gestionar turnos;
  - administrar servicios y horarios;
  - gestionar integrantes del equipo;
  - generar Stories de horarios disponibles;
  - descargar o compartir Stories desde mobile.
- Acceso administrativo mediante magic link.
- SEO técnico: metadata, Open Graph, sitemap, robots y datos estructurados.
- Diseño responsive optimizado para mobile, incluyendo navegación sticky en el panel admin.

## Stack

- [Next.js 16](https://nextjs.org/) con App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Drizzle ORM
- PostgreSQL / Neon
- Better Auth y magic links para acceso administrativo
- Mercado Pago para pagos opcionales
- Resend para emails
- Vercel Analytics y Speed Insights

## Requisitos

- Node.js 20+
- pnpm
- PostgreSQL

## Instalación

```bash
git clone https://github.com/alandmmzz/LumaCentroEstetico.git
cd LumaCentroEstetico
pnpm install
```

Copiá las variables de entorno en `.env.local` y completá únicamente las necesarias para tu entorno. Nunca subas ese archivo al repositorio.

```bash
pnpm dev
```

La aplicación estará disponible en `http://localhost:3000`.

## Variables de entorno

### Requeridas

```env
DATABASE_URL=
BETTER_AUTH_SECRET=
```

### Administración y emails

```env
ADMIN_EMAILS=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
BOOKING_NOTIFICATION_EMAILS=
```

### Pagos

```env
MERCADOPAGO_ACCESS_TOKEN=
NEXT_PUBLIC_DEPOSIT_ENABLED=true
```

Mercado Pago es opcional. Si no se configura `MERCADOPAGO_ACCESS_TOKEN`, el flujo de reserva sigue funcionando sin el pago online.

## Scripts

```bash
pnpm dev      # desarrollo
pnpm build    # build de producción
pnpm start    # ejecutar el build
pnpm lint     # revisar lint
```

## Estructura principal

```text
app/
├── actions/              # Server Actions, reservas y operaciones del admin
├── api/                  # Route Handlers
├── admin/                # Panel administrativo
├── reservar/             # Flujo público de reservas
├── globals.css           # Tokens y estilos globales
├── layout.tsx            # Metadata, fuentes y providers
└── page.tsx              # Landing principal

components/               # Componentes de UI públicos y administrativos
lib/
├── db/                   # Conexión, schema y servicios de base de datos
├── admin-auth.ts         # Magic links y sesiones administrativas
├── mercadopago.ts        # Preferencias y verificación de pagos
├── schedule.ts           # Reglas de disponibilidad
└── time-slots.ts         # Cálculo de horarios

public/                   # Logos, imágenes y assets de la marca
```

## Seguridad antes de publicar

Antes de hacer público el repositorio:

1. Confirmá que `.env.local`, `.env*.local` y cualquier archivo con secretos estén ignorados por Git.
2. Revisá el historial del repositorio por si alguna key o token fue commiteado anteriormente.
3. Rotá cualquier credencial que haya aparecido en commits, logs o capturas.
4. Configurá los emails de administración exclusivamente mediante `ADMIN_EMAILS`; no dependas de valores fallback en código.
5. Usá un `BETTER_AUTH_SECRET` aleatorio de al menos 32 caracteres.
6. Mantené las credenciales de Mercado Pago, Resend y la base de datos únicamente en variables de entorno.
7. Verificá que el repositorio no contenga datos reales de clientes, turnos, teléfonos o emails.

El código puede ser público; las credenciales, datos personales y configuraciones privadas no deben formar parte del repositorio.

## Deploy

El proyecto está preparado para desplegarse en [Vercel](https://vercel.com/). Configurá las variables de entorno en el proyecto de Vercel, conectá PostgreSQL y ejecutá el deploy desde GitHub o mediante la integración de Vercel.

Para un entorno de producción, revisá especialmente:

- `DATABASE_URL` de producción;
- `BETTER_AUTH_SECRET` único para producción;
- URL pública utilizada por los retornos de Mercado Pago;
- dominio verificado en Resend;
- emails de administración y notificaciones;
- migraciones o schema de PostgreSQL.

## Estado del proyecto

Aplicación funcional en evolución, utilizada para la operación de LUMA Centro Estético. Las decisiones de diseño priorizan una experiencia cálida, editorial y simple para que las clientas puedan conocer los servicios y reservar su momento.

## Licencia

Este proyecto es propietario de LUMA Centro Estético. El código puede ser visible con fines de portfolio y referencia técnica, pero no se autoriza su uso comercial, redistribución o reutilización sin permiso explícito.

## Autoría

Desarrollado para LUMA Centro Estético por [Aland Marpe](https://github.com/alandmmzz).
