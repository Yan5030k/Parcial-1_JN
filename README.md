# Parcial Primer Cómputo - Programación IV

**Estudiantes:**
* Jhoan Mauricio Ortega Ventura (B2) | SMSS003224
* Jeremías Neftaly Fuentes Méndez (B1) | SMSS067624

---

### Preguntas y Respuestas:

1. Valor agregado de WebComponents:
Usamos WebComponents para encapsular el panel de administración (<admin-panel>), lo que nos permite modularizar el código y evitar conflictos con el CSS global. Esto facilita la reutilización del componente en otras partes de la aplicación sin que afecte el diseño general.

2. Manipulación de datos sin recargar la página:
Usamos event.preventDefault() para evitar la recarga de la página al enviar los formularios. Los datos se procesan en JavaScript y actualizamos la interfaz en tiempo real con la función refreshUI(), sin necesidad de hacer peticiones al servidor.

3. Validación de entradas:
La validación se hace en dos niveles:

HTML5: Usamos atributos como required y min para asegurar que los datos sean correctos desde la interfaz.

JavaScript: Validamos que los datos no estén vacíos y que los valores sean numéricos antes de procesarlos.

4. Escalabilidad futura:
La arquitectura con WebComponents facilita la adición de nuevos componentes sin afectar el código existente. Para escalar el almacenamiento, planeamos mover los datos a una API RESTful conectada a una base de datos, manteniendo la misma lógica de visualización.