# Parcial Primer Cómputo - Programación IV

**Estudiantes:**
* Jhoan Mauricio Ortega Ventura (B2) | SMSS003224
* Jeremías Neftaly Fuentes Méndez (B1) | SMSS067624

---

### Preguntas y Respuestas:

**1. ¿Qué valor agregado tiene el uso de webcomponents a su proyecto?**
El principal valor es la **encapsulación y modularidad**. Al utilizar el *Shadow DOM* dentro de nuestro componente `<admin-panel>`, aseguramos que los estilos y la estructura del panel de administración no interfieran ni se rompan con el CSS global de la página principal. Además, nos permite reutilizar este bloque de código en cualquier otra vista de la aplicación de la concesionaria simplemente invocando la etiqueta `<admin-panel>`, facilitando el mantenimiento.

**2. ¿De qué forma manipularon los datos sin recargar la página?**
Utilizamos el evento `submit` en los formularios y aplicamos el método `event.preventDefault()` para detener el comportamiento predeterminado del navegador (que es recargar la página). Los datos se capturan mediante DOM scripting (`querySelector`), se procesan en la memoria utilizando un estado local (arreglos para inventario y ventas), y luego llamamos a una función `refreshUI()` que vuelve a renderizar dinámicamente las tablas utilizando `innerHTML`. Además, usamos los eventos `input` y `change` para manipular el DOM en tiempo real y calcular el total a cobrar instantáneamente mientras el usuario interactúa con el formulario de ventas.

**3. ¿De qué forma validaron las entradas de datos? Expliquen brevemente.**
Implementamos un **doble filtro de validación** (Front-end y Lógica JS):
* **Nivel HTML5:** Utilizamos atributos nativos en las etiquetas `<input>` como `required`, `min`, `max`, `step`, y `pattern` (expresiones regulares) para garantizar formatos correctos desde la interfaz (ej. bloquear texto en campos de precio o números negativos en stock).
* **Nivel JavaScript:** Antes de procesar los datos, nuestras funciones verifican que los campos no estén vacíos usando `.trim()`, convierten los valores con `parseInt` o `parseFloat`, y validan con `isNaN`. 
* **Lógica de negocio:** Bloqueamos la creación de vehículos duplicados (misma marca, modelo y año) y evitamos que se realicen ventas si la cantidad solicitada es mayor al stock disponible en el inventario.

**4. ¿Cómo manejaría la escalabilidad futura en su página?**
Gracias a la arquitectura basada en Web Components, la escalabilidad en el Frontend es directa: podemos crear nuevos componentes independientes (ej. `<catalogo-clientes>` o `<graficos-ventas>`) e inyectarlos sin afectar el código actual. En cuanto a los datos, actualmente usamos un objeto `Storage` basado en `localStorage` para persistencia local. Para escalar, simplemente refactorizaríamos los métodos `Storage.load()` y `Storage.save()` para que realicen peticiones asíncronas (`fetch` o `axios`) hacia una API RESTful y una base de datos real en un servidor backend, manteniendo intacta la lógica visual del componente.