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

## Conectar la app al XAMPP de la laptop

En **Ajustes**, configura la URL base HTTP de la API, por ejemplo `http://192.168.1.66/ble_radar/api`. Usa la IP LAN actual de la laptop; desde el celular, `localhost` apunta al mismo celular, no a la laptop. Si Apache usa un puerto distinto del 80, inclúyelo en la URL (por ejemplo `http://192.168.1.66:8080/ble_radar/api`). Para IPv6, escribe la dirección entre corchetes.

El puerto `3306` pertenece al protocolo MySQL y **no** se escribe en la app. La app solicita `health.php` y `observaciones.php` por HTTP; PHP en XAMPP conecta a MySQL usando su configuración local. Asegúrate de que Apache acepte conexiones de la red local, que el firewall de Windows permita su puerto HTTP y que teléfono y laptop estén en la misma red. El botón **Probar conexión** espera que `health.php` devuelva JSON con `success: true` después de comprobar MySQL.

El historial usa `GET observaciones.php` con `{ "success": true, "data": [...] }` (también acepta una lista JSON directa). Guardar usa `POST observaciones.php` con `device_id`, `nombre`, `rssi` y `nota`; se espera `{ "success": true, "data": { "id": 1 } }`. La URL base guardada en Ajustes se reutiliza para la prueba, el historial y los guardados manuales y automáticos.
