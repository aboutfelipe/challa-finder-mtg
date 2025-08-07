# Carta Finder CL - Instrucciones de Uso

## Requisitos para Scraping Real

Para usar el scraping real en lugar de datos simulados, necesitas ejecutar el servidor backend:

### 1. Instalar dependencias del servidor
```bash
cd server
npm install
```

### 2. Ejecutar el servidor de scraping
```bash
cd server
npm start
```

O desde la raíz del proyecto:
```bash
npm run server
```

### 3. Ejecutar la aplicación frontend
En otra terminal:
```bash
npm run dev
```

### 4. Desarrollo completo (ambos servidores)
Para ejecutar ambos servidores simultáneamente:
```bash
npm run dev:full
```

## Estado del Scraping

La aplicación ahora muestra claramente:
- 🟢 **Scraping Real Activo**: Cuando está conectado al servidor y haciendo scraping real
- 🔴 **Error**: Cuando el servidor no está disponible o hay problemas

## Puertos
- Frontend: http://localhost:8080
- Backend (Scraper): http://localhost:3001

## Tiendas Incluidas
- Catlotus (https://catlotus.cl)
- Pay2Win (https://www.paytowin.cl)
- La Cripta (https://lacripta.cl)
- TCGMatch (https://tcgmatch.cl)

## Notas Importantes
- El scraping real puede tomar varios segundos por tienda
- Cada sitio tiene medidas anti-bot, por lo que algunos requests pueden fallar
- Los resultados se cachean por 5 minutos para evitar scraping excesivo