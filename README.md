# Proyecto_Fued
Desarrollar una aplicacion funcional para el viernes.

# Proyecto Radar BLE

Aplicación móvil con escáner Bluetooth y conexión a base de datos.

## Roles del Equipo

* **Guadalupe**: Base de Datos (MySQL) y APIs REST (PHP).
* **Jay & Yafet**: Funcionamiento del Radar BLE, Configuración del Entorno Nativo y Lógica del Radar.
* **Michel**: Vistas y Experiencia de Usuario (Inicio, Radar, Detalles, Historial).
* **Alejandro & Yael**: Conexión Backend-Frontend (Axios) y Filtro de Datos del Radar

## Probar el radar BLE en Android

1. Instala las dependencias con `npm install`.
2. Sincroniza Capacitor y los plugins nativos con `npx cap sync android`.
3. Abre el proyecto Android con `npx cap open android` y ejecútalo en un teléfono físico.
4. Acepta los permisos que solicite Android y mantén Bluetooth encendido para escanear.
5. En el detalle de un dispositivo, pulsa **Conectar y leer datos** para intentar consultar sus características GATT legibles.

La distancia se clasifica como **Cerca** (RSSI >= -60 dBm), **Medio** (-80 a -61 dBm) o **Lejos** (RSSI < -80 dBm). Es una aproximación basada en señal, no una medición en metros. Los periféricos pueden no permitir conexiones o lecturas; los valores GATT que sí se lean se muestran en hexadecimal.
