/**
 * Spanish (default locale) dictionary. This file defines the shape;
 * `en.ts` must satisfy it. Every user-visible string lives here —
 * hardcoding text in components/pages is a review-blocking defect.
 */
export const es = {
  nav: {
    ariaMain: 'Navegación principal',
    home: 'Inicio',
    products: 'Productos',
    collections: 'Colecciones',
  },
  footer: {
    ariaLegal: 'Enlaces legales',
    privacy: 'Privacidad',
    terms: 'Términos y condiciones',
    shipping: 'Envíos y devoluciones',
    copyright: 'VEXXX. Todos los derechos reservados.',
  },
  home: {
    metaTitle: 'VEXXX — Streetwear',
    metaDescription:
      'VEXXX: marca de streetwear. Drops limitados, calidad premium. Envíos a todo el mundo.',
    heading: 'VEXXX',
  },
  products: {
    metaTitle: 'Productos',
    metaDescription:
      'Catálogo completo de VEXXX: camisetas, sudaderas y accesorios streetwear.',
    heading: 'Productos',
    empty: 'No hay productos disponibles.',
  },
  collections: {
    metaTitle: 'Colecciones',
    metaDescription: 'Colecciones y drops de VEXXX.',
    heading: 'Colecciones',
    empty: 'No hay colecciones disponibles.',
  },
  product: {
    breadcrumbHome: 'Inicio',
    breadcrumbProducts: 'Productos',
  },
  legal: {
    privacy: {
      metaTitle: 'Política de privacidad',
      metaDescription: 'Cómo VEXXX recoge, usa y protege tus datos personales.',
      heading: 'Política de privacidad',
      body: 'Contenido legal pendiente de redacción por el equipo legal.',
    },
    terms: {
      metaTitle: 'Términos y condiciones',
      metaDescription:
        'Condiciones de compra y uso de la tienda online de VEXXX.',
      heading: 'Términos y condiciones',
      body: 'Contenido legal pendiente de redacción por el equipo legal.',
    },
    shipping: {
      metaTitle: 'Envíos y devoluciones',
      metaDescription:
        'Plazos, costes de envío y política de devoluciones de VEXXX.',
      heading: 'Envíos y devoluciones',
      body: 'Política de envíos pendiente de redacción.',
    },
  },
  notFound: {
    metaTitle: 'Página no encontrada',
    heading: 'Página no encontrada',
    body: 'La página que buscas no existe o fue movida.',
    backHome: 'Volver al inicio',
  },
};

export type Dictionary = typeof es;
