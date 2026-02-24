# Parcial Primer Cómputo - Programación IV

**Estudiantes:**
* Jhoan Mauricio Ortega Ventura (B2) | SMSS003224
* Jeremías Neftaly Fuentes Méndez (B1) | SMSS067624

---

### Preguntas y Respuestas:

**1. ¿Qué valor agregado tiene el uso de webcomponents a su proyecto?**
El principal valor es la **encapsulación y modularidad**. Al utilizar el *Shadow DOM* dentro de nuestro componente `<admin-panel>`, aseguramos que los estilos y la estructura del panel de administración no interfieran ni se rompan con el CSS global de la página principal. Además, nos permite reutilizar este bloque de código en cualquier otra vista de la aplicación de la concesionaria simplemente invocando la etiqueta `<admin-panel>`, facilitando el mantenimiento.

**2. ¿De qué forma manipularon los datos sin recargar la página?**
Utilizamos el evento `submit` en los formularios y aplicamos el método `event.preventDefault()` para detener el comportamiento predeterminado del navegador (que es recargar la página). Los datos ingresados se capturan mediante DOM scripting (`querySelector` y la propiedad `value`), se procesan en la memoria utilizando un arreglo de objetos (nuestro estado local) y luego llamamos a una función `refreshUI()` que vuelve a renderizar dinámicamente las tablas y selectores utilizando `innerHTML`.

**3. ¿De qué forma validaron las entradas de datos? Expliquen brevemente.**
Implementamos validaciones estrictas en el lado del cliente (JavaScript) antes de guardar cualquier dato. Creamos funciones de utilidad (`isNonEmptyText`, `toInt`, `toFloat`) para asegurar el tipo de dato correcto. Durante la ejecución, verificamos que:
* Los campos de texto no estén vacíos utilizando `.trim()`.
* Los valores numéricos (precio, stock) sean positivos y válidos (`Number.isFinite`).
* El año del vehículo esté dentro de un rango lógico (1980 - año actual).
* En el módulo de ventas, validamos que la cantidad a vender no supere el stock disponible del auto seleccionado, lanzando mensajes de error visuales en caso de inconsistencias.

**4. ¿Cómo manejaría la escalabilidad futura en su página?**
Gracias a la arquitectura basada en Web Components, la escalabilidad en el Frontend es directa: podemos crear nuevos componentes independientes (ej. `<catalogo-clientes>` o `<graficos-ventas>`) e inyectarlos sin afectar el código actual. En cuanto a los datos, actualmente usamos un objeto `Storage` basado en `localStorage` para persistencia local. Para escalar, simplemente refactorizaríamos los métodos `Storage.load()` y `Storage.save()` para que realicen peticiones asíncronas (`fetch` o `axios`) hacia una API RESTful y una base de datos real en un servidor backend, manteniendo intacta la lógica visual del componente.