# Guion de Presentacion - TI Garantias

Este documento consolida el guion sugerido para exponer la presentacion de `TI Garantias` en el diplomado de DevOps. Incluye:

- que decir en cada diapositiva
- como conectar una diapositiva con la siguiente
- que conviene mejorar, resumir o quitar

## Recomendacion general de exposicion

- Mantener un ritmo claro y breve: entre 45 segundos y 1 minuto por diapositiva tecnica.
- No leer literalmente todo el texto del slide; usar el slide como apoyo visual y el guion como referencia.
- En las diapositivas de arquitectura, explicar primero la idea general y luego 2 o 3 elementos clave.
- Cuando una diapositiva es muy densa, cerrar con una frase de resumen.

## Estructura sugerida

1. Portada
2. Contexto y objetivo
3. Gestion del trabajo
4. Solucion propuesta
5. Stack tecnico
6. Gestion de backlog
7. Arquitectura ejecutiva
8. Arquitectura tecnica detallada
9. Inventario de recursos
10. Arquitectura full detail
11. Arquitectura C4
12. Pipeline CI/CD
13. Incidencias reales y aprendizajes
14. Resultados obtenidos
15. Recomendaciones y proximos pasos
16. Cierre

## Diapositiva 1. Portada

### Que decir

"Buenos dias. Somos el Grupo 1, conformado por Armando Chavez, Geovanny Robles y Guido Vallejo. Hoy les presentamos nuestro proyecto TI Garantias, un portal interno para la gestion de garantias, retenciones y devolucion de TI, desarrollado con un enfoque integral de practicas DevOps."

### Objetivo de esta diapositiva

- Presentar al equipo.
- Dar el nombre del proyecto.
- Enmarcar desde el inicio que no es solo una aplicacion, sino un proyecto con enfoque DevOps.

### Transicion

"Primero les contamos brevemente el problema que buscamos resolver y el objetivo del piloto."

### Mejorar o quitar

- Mantenerla simple.
- No agregar mas texto.
- Si quieres mejorarla, solo cuida consistencia visual en nombres y tecnologias.

## Diapositiva 2. Contexto y objetivo

### Que decir

"El problema que buscamos resolver fue la falta de trazabilidad y centralizacion en procesos como facturas, contratos, entregables y devoluciones. Ademas, queriamos evitar despliegues manuales y mejorar la visibilidad operativa del sistema. Por eso, el objetivo del piloto fue construir una aplicacion funcional, segura y auditable, con automatizacion de pruebas, despliegues, infraestructura como codigo y monitoreo en Azure."

### Objetivo de esta diapositiva

- Explicar el problema.
- Justificar por que el proyecto era necesario.
- Introducir el objetivo tecnico y operativo.

### Transicion

"Con ese contexto, el siguiente paso fue definir como ibamos a organizar el trabajo y dar seguimiento al proyecto."

### Mejorar o quitar

- Esta bien como esta.
- Si queda muy cargada, reducir a 4 bullets maximo.

## Diapositiva 3. Gestion del trabajo

### Que decir

"En esta diapositiva mostramos como organizamos el trabajo del proyecto. El backlog fue gestionado en Jira con epicas, historias y tareas tecnicas. La organizacion se realizo por sprint, responsables y estado de avance. La priorizacion se hizo considerando valor, dependencias y esfuerzo. Ademas, tuvimos trazabilidad entre Jira y GitHub, ya que varias tareas estaban vinculadas con ramas, commits, pull requests y compilaciones. Esto nos permitio conectar la gestion del trabajo con la ejecucion tecnica real."

### Objetivo de esta diapositiva

- Mostrar evidencia de gestion del proyecto.
- Probar que hubo organizacion formal del trabajo.
- Mostrar integracion entre Jira y GitHub.

### Transicion

"Una vez organizada la gestion del proyecto, definimos la solucion funcional y tecnica que ibamos a construir."

### Mejorar o quitar

- Si logras guardar las capturas de Jira como archivo local, conviene insertarlas directamente aqui.
- Esta diapositiva si vale la pena mantenerla porque fortalece mucho la defensa del diplomado.

## Diapositiva 4. Solucion propuesta

### Que decir

"La solucion propuesta fue construir un portal interno que centraliza la gestion operativa del proceso. La idea no fue solamente desarrollar una aplicacion, sino acompanarla con una base DevOps solida: autenticacion, backend, frontend, base de datos, contenedores, CI/CD, infraestructura automatizada y observabilidad. Es decir, pensamos el proyecto no solo como software, sino como un producto desplegable y operable."

### Objetivo de esta diapositiva

- Explicar el alcance real de la solucion.
- Mostrar que el proyecto fue concebido de forma integral.

### Transicion

"Para soportar esta solucion definimos un stack tecnico alineado con el enfoque DevOps."

### Mejorar o quitar

- Mantenerla.
- Si tienes una diapositiva adicional muy parecida, esta es la que debe quedarse porque conecta negocio y tecnologia.

## Diapositiva 5. Stack tecnico

### Que decir

"El frontend fue desarrollado con Angular y Angular Material, y se publica con Nginx. El backend fue construido con ASP.NET Core .NET 8, usando Entity Framework Core, JWT y RBAC para autenticacion y autorizacion. La base de datos es PostgreSQL, y en la capa DevOps utilizamos Docker, GitHub Actions, Jenkins, Terraform y Azure. Este stack nos permitio cubrir tanto la parte funcional como la automatizacion de entrega y operacion."

### Objetivo de esta diapositiva

- Resumir tecnologias usadas.
- Justificar que hubo herramientas para desarrollo y para operacion.

### Transicion

"Con el stack definido, organizamos el backlog del trabajo en epicas y frentes principales."

### Mejorar o quitar

- Corregir nombres de herramientas si hace falta.
- Cambiar `Prometeus` por `Prometheus` si aun aparece asi en otra diapositiva.

## Diapositiva 6. Gestion de backlog

### Que decir

"En la gestion del backlog organizamos el trabajo en epicas principales, como modelo de dominio, autenticacion, backend core, frontend, observabilidad, contenedores, CI/CD, infraestructura y documentacion. La priorizacion se hizo considerando valor, dependencias, esfuerzo y riesgo. Tambien definimos criterios de calidad para cerrar cada tarea, incluyendo revision, pruebas y documentacion."

### Objetivo de esta diapositiva

- Mostrar que el trabajo se estructuro por frentes claros.
- Enlazar gestion de proyecto con ejecucion tecnica.

### Transicion

"Con esa base de trabajo, pasamos a explicar la arquitectura de la solucion, empezando por la vista mas ejecutiva."

### Mejorar o quitar

- Esta diapositiva se puede mantener aunque ahora exista la de `Gestion del trabajo`.
- Si necesitas reducir tiempo, puedes fusionar el mensaje de esta diapositiva con la 3 en tu discurso.

## Como introducir la seccion de diagramas

"A continuacion voy a explicar los diagramas de arquitectura del proyecto. Los organizamos en varias vistas porque cada una responde una pregunta distinta. La primera vista muestra que hace la solucion a alto nivel. La segunda y tercera muestran como esta organizada la infraestructura. La cuarta muestra el flujo operativo completo. Y la ultima baja al modelo C4 para explicar el sistema desde contexto, contenedores y componentes."

## Diapositiva 7. Arquitectura ejecutiva

### Que decir

"Esta es la vista ejecutiva de la arquitectura. Aqui resumimos toda la solucion en dos grandes bloques: el flujo de la aplicacion y el flujo de CI/CD.

Primero, en la parte de aplicacion, el flujo principal es: usuarios, internet, frontend, backend y base de datos PostgreSQL. Los usuarios entran por internet hacia el frontend, que es el recurso `tigarantias-{env}-fe`. Ese frontend tiene ingreso publico por el puerto 80 y es el unico punto expuesto al usuario final.

Luego, el frontend se comunica con el backend, que es `tigarantias-{env}-be`. Ese backend no esta expuesto publicamente, sino que tiene ingreso interno por el puerto 8080. Eso significa que el usuario nunca llega directamente al backend; siempre entra por el frontend.

Despues, el backend procesa la logica de negocio y se conecta a PostgreSQL Flexible Server, que es donde vive la persistencia transaccional del sistema.

En esta misma vista tambien aparecen componentes de soporte. Por ejemplo, Log Analytics, que recibe la observabilidad nativa de Azure Container Apps. Tambien vemos la Managed Identity, que permite que la aplicacion acceda de forma segura a los secretos. Y vemos Key Vault, donde se guardan secretos como cadenas de conexion, JWT y credenciales sensibles. La relacion importante aqui es que la aplicacion no usa secretos escritos directamente en codigo; los consume desde Key Vault usando identidad administrada.

Luego, en la parte inferior, aparece el flujo de CI/CD. Aqui vemos que el repositorio Git contiene el codigo y el Jenkinsfile. Jenkins corre en una maquina virtual dentro de `shared-rg`, en un contenedor. Ese Jenkins hace build, pruebas, push de imagenes y despliegue con Terraform. Las imagenes de frontend y backend se publican en Docker Hub. Y el estado remoto de Terraform se guarda en un Storage Account llamado `sttigarantiastfstate01`.

Tambien esta vista nos deja claro que existen varios Resource Groups. Uno para el estado remoto, otro administrado por Azure para red, uno compartido para Jenkins y monitoreo, y uno por ambiente de aplicacion.

Si tuviera que resumir esta lamina en una frase, diria: esta vista muestra quien entra al sistema, por donde entra, donde se procesan los datos, donde se almacenan los secretos y como se automatiza el despliegue."

### Objetivo de esta diapositiva

- Dar la vista general.
- Explicar frontend publico y backend interno.
- Introducir CI/CD y secretos sin entrar aun a mucho detalle.

### Transicion

"Con esta vista ya entendimos el panorama general; ahora bajamos al detalle tecnico."

### Mejorar o quitar

- Mantenerla.
- Es una de las mas importantes para que el tribunal entienda el sistema.

## Diapositiva 8. Arquitectura tecnica detallada

### Que decir

"En esta segunda vista ya no mostramos solo los componentes, sino que separamos la solucion por carriles segun el tipo de flujo. Eso permite leer la arquitectura de forma mas tecnica.

La primera zona es la de suscripcion y Resource Groups. Aqui se observa que la suscripcion contiene varios grupos de recursos: el del tfstate, el `NetworkWatcherRG`, el grupo compartido `tigarantias-shared-rg`, y el grupo de aplicacion `tigarantias-{env}-rg`.

Dentro del grupo compartido esta la base de automatizacion: la VNet, el NSG, la IP publica, la NIC y la VM de Jenkins. Dentro del grupo de aplicacion estan el frontend, backend, managed environment, Key Vault, managed identity, PostgreSQL, storage y Log Analytics.

Luego viene el carril azul, que representa el runtime de aplicacion. Aqui el recorrido es: usuarios o navegador, acceso por internet, frontend, backend y PostgreSQL. El frontend publica un FQDN publico de Azure Container Apps. Ese frontend hace proxy al backend usando `BACKEND_UPSTREAM`. El backend se encarga de la API y de la logica de negocio. Y PostgreSQL almacena la informacion persistente.

Despues vemos el carril verde, que representa seguridad y secretos. Aqui aparece la Managed Identity, que tiene permiso para leer secretos del Key Vault. El Key Vault almacena valores como `connection-string`, `jwt-secret` y `registry-password`. Luego tanto el backend como el frontend consumen esos secretos mediante referencias seguras. Eso evita credenciales hardcodeadas y centraliza la gestion sensible.

El siguiente carril es el morado, que representa observabilidad. Aqui vemos dos niveles. Uno es Azure nativo, donde el Managed Environment envia informacion a Log Analytics. El otro es el stack de monitoreo en la VM compartida. VM significa maquina virtual, es decir, un servidor aprovisionado en la nube donde instalamos herramientas de monitoreo y soporte operativo.

Dentro de esa maquina virtual estan Prometheus, Grafana, Loki, Promtail y cAdvisor. Prometheus se encarga de recolectar metricas, por ejemplo tiempos de respuesta, uso de recursos o metricas expuestas por la aplicacion. Grafana es la herramienta que nos permite visualizar esas metricas en dashboards.

En la parte de logs utilizamos Loki y Promtail. Loki es el sistema que almacena y organiza los logs. Promtail es el agente que lee los logs desde los servicios o contenedores y los envia hacia Loki. Es decir, Promtail recolecta, Loki almacena y Grafana permite consultarlos visualmente.

Ademas, usamos cAdvisor, que expone metricas del host y de los contenedores, como CPU, memoria, red y almacenamiento. Esas metricas luego son consumidas por Prometheus y visualizadas en Grafana.

En resumen, en la maquina virtual compartida montamos un stack de observabilidad donde Prometheus y cAdvisor cubren metricas, Promtail y Loki cubren logs, y Grafana centraliza la visualizacion.

Finalmente, el carril naranja representa CI/CD y despliegue. Aqui el repositorio alimenta a Jenkins. Jenkins hace build, test, push de imagenes y ejecuta Terraform. Docker Hub actua como registro de imagenes. Terraform usa el estado remoto almacenado en Storage. Y luego actualiza recursos tanto en `shared-rg` como en cada ambiente.

Esta lamina es importante porque deja ver que no todo el trafico es igual. Hay trafico de datos, trafico de secretos, trafico de monitoreo y trafico de despliegue. Y cada uno fue separado y modelado de forma explicita."

### Objetivo de esta diapositiva

- Demostrar aterrizaje tecnico real.
- Mostrar separacion de flujos.

### Transicion

"Ahora que vimos el flujo, pasamos al inventario real de recursos desplegados."

### Mejorar o quitar

- Mantenerla.
- Si el tiempo es corto, reducir la explicacion a solo los 4 carriles.

## Diapositiva 9. Inventario de recursos

### Que decir

"Esta tercera vista no esta pensada para explicar el flujo, sino para responder una pregunta de gobierno e inventario: que recursos existen y en que grupo de recursos estan.

Arriba se ve la suscripcion como el nivel superior. Debajo se listan los Resource Groups detectados y los recursos dentro de cada uno.

El primero es `rg-ti-garantias-tfstate`. Aqui esta el Storage Account `sttigarantiastfstate01`. Su funcion no es atender usuarios, sino guardar el estado remoto de Terraform. Es decir, guarda la memoria de la infraestructura.

Luego esta `NetworkWatcherRG`. Aqui aparecen `NetworkWatcher_eastus` y `NetworkWatcher_centralus`. Este grupo pertenece a los servicios administrados de Azure para diagnostico y monitoreo de red. No es parte directa del negocio, pero si del contexto operativo del entorno.

Despues esta `tigarantias-shared-rg`. Este grupo agrupa la infraestructura compartida del proyecto. Aqui estan la VNet, el NSG, la IP publica, la NIC y la VM `tigarantias-jenkins-vm`. Tambien se detallan servicios que corren dentro de esa VM como contenedores: Grafana, Prometheus, Loki, Promtail y cAdvisor. Ademas se muestran puertos, IP privada e IP publica. Este bloque es clave porque representa la plataforma comun que da soporte al proyecto.

Finalmente esta el grupo de aplicacion `tigarantias-{env}-rg`. Aqui aparecen la Managed Identity, el Key Vault, el Storage, el Log Analytics, el Managed Environment, el Container App del frontend, el Container App del backend y PostgreSQL Flexible Server. Tambien se resumen las relaciones principales: frontend hacia backend, backend hacia PostgreSQL, managed identity hacia Key Vault, y el consumo de imagenes desde Docker Hub.

La ventaja de esta vista es que sirve para inventario tecnico y control de alcance. Si alguien pregunta que recursos exactos se desplegaron, esta es la lamina correcta para responder. Mientras otras vistas explican flujo, esta explica estructura y pertenencia."

### Objetivo de esta diapositiva

- Mostrar orden y gobierno de infraestructura.
- Responder exactamente que se desplego.

### Transicion

"Despues del inventario, esta vista integra todos los flujos operativos en un solo diagrama."

### Mejorar o quitar

- Mantenerla si el jurado valora infraestructura.
- Si te piden acortar mucho, esta podria resumirse rapido en 30 segundos.

## Diapositiva 10. Arquitectura full detail

### Que decir

"Esta es la vista operativa mas completa de toda la solucion. Aqui ya se integran en un solo diagrama los recursos, los flujos y las rutas por tipo de trafico.

En la parte superior se explica que existen buses dedicados para distintos tipos de flujo: `DATA`, `CONTROL`, `OBS` y `CICD`. Eso significa que el diagrama no mezcla todo en una sola linea, sino que organiza cada relacion segun su proposito.

Primero esta la zona de suscripcion y catalogo de Resource Groups. Ahi se resume que la suscripcion contiene el grupo de tfstate, el NetworkWatcher, el grupo compartido y el grupo del ambiente. Tambien se especifica que `shared` contiene Jenkins, red y servicios compartidos, mientras que el ambiente contiene runtime, datos, secretos y observabilidad.

Luego esta la seccion de runtime de aplicacion. Aqui se ve a los usuarios entrando desde navegador e internet hacia el frontend. El frontend esta publicado en Azure Container Apps como servicio publico. Ese frontend expone un FQDN en `azurecontainerapps.io`. Luego el frontend reenvia las llamadas de `/api` al backend. El backend, que es interno, se comunica con PostgreSQL para hacer consultas y persistencia.

Despues viene la seccion de seguridad y secretos. Aqui se muestra la identidad administrada, que es la forma segura de autorizar el acceso a secretos. El Key Vault almacena secretos de aplicacion y tambien secretos para el registro de imagenes. Entre esos secretos estan la cadena de conexion, el JWT y la credencial de Docker Hub. Tanto frontend como backend dependen de estos secretos para operar correctamente.

La siguiente zona es la de observabilidad. Ahi vemos el Managed Environment, el Log Analytics Workspace y el stack de monitoreo sobre la VM compartida. Es decir, por un lado la solucion usa observabilidad nativa de Azure; por otro lado usa un stack propio con Grafana, Prometheus, Loki, Promtail y cAdvisor. Esto da una visibilidad mas completa sobre metricas, logs y operacion.

Luego esta la zona de CI/CD e infraestructura. Aqui se ve el repositorio Git, Jenkins, Docker Hub, el Storage del estado remoto y el destino Azure. La lamina incluso muestra las etapas del pipeline: checkout, validacion Terraform, pruebas backend, build frontend, build y push de imagenes, apply de Terraform y bootstrap de secretos y PostgreSQL. Esta parte demuestra que el despliegue fue modelado como parte de la arquitectura y no como una tarea separada.

Esta es probablemente la lamina mas completa para una defensa tecnica, porque conecta aplicacion, seguridad, monitoreo y automatizacion en una sola vista."

### Objetivo de esta diapositiva

- Integrar todo en una sola vista.
- Mostrar madurez tecnica.

### Transicion

"Y para cerrar la parte de arquitectura, usamos un modelo C4 para explicar la solucion por niveles."

### Mejorar o quitar

- Mantenerla.
- No entrar en todos los detalles; escoger 3 o 4 puntos maximo durante la exposicion.

## Diapositiva 11. Arquitectura C4

### Que decir

"En esta ultima vista usamos el modelo C4, que sirve para explicar la arquitectura por niveles de abstraccion. Aqui el valor no esta en ver mas recursos, sino en ordenar mejor como entendemos el sistema.

La primera parte es `C1`, System Context. Aqui se muestran los usuarios internos usando el portal mediante un navegador web. El sistema TI Garantias aparece como una solucion que combina frontend y backend para gestionar usuarios, facturas y catalogos. Tambien se muestran actores y sistemas externos relacionados, como Azure Subscription, Jenkins, Docker Hub, Key Vault, PostgreSQL, Log Analytics y el stack de monitoreo. La idea del contexto es responder: quien usa el sistema y de que otros servicios depende.

La segunda parte es `C2`, Container Diagram. Aqui ya se separa la solucion en contenedores principales. Esta el usuario con navegador, el frontend SPA en Angular, el backend API en .NET, PostgreSQL, el Managed Environment, Log Analytics, Key Vault, Managed Identity, Docker Hub y el stack de monitoreo. Cada contenedor tiene su responsabilidad. El frontend entrega la interfaz y hace proxy a `/api`, `/swagger` y `/metrics`. El backend contiene JWT, reglas de negocio, CORS, autenticacion y servicios de dominio. PostgreSQL maneja la persistencia. Key Vault almacena secretos. Managed Identity permite leer esos secretos. Y el stack de monitoreo consolida metricas y logs.

La tercera parte es `C3`, Component Diagram del backend. Aqui ya se entra a los componentes internos de la API. Se muestran controladores, servicios de negocio, `AppDbContext`, configuraciones, utilidades e integraciones como correo, almacenamiento de adjuntos e inicializacion con Hangfire. Finalmente, se refleja la capa de base de datos con migrations, entities y contexto.

La ventaja del C4 es que termina de conectar todo lo que vimos antes. Primero entendemos el sistema en su contexto, luego vemos sus contenedores y al final vemos como esta armado el backend por dentro."

### Objetivo de esta diapositiva

- Ordenar la explicacion de arquitectura.
- Mostrar capacidad de documentacion tecnica formal.

### Transicion

"Una vez explicada la arquitectura, mostramos como automatizamos la integracion y el despliegue del proyecto."

### Mejorar o quitar

- Mantenerla si quieres cerrar fuerte la parte de arquitectura.
- Si el tiempo es muy corto, resumir solo C1 y C2.

## Diapositiva 12. Pipeline CI/CD

### Que decir

"En esta parte mostramos el flujo CI/CD del proyecto. La integracion continua se realiza con GitHub Actions, donde validamos backend, frontend y Terraform. La entrega continua se realiza con Jenkins, que construye imagenes, publica artefactos, sincroniza secretos y ejecuta Terraform para desplegar la infraestructura. Con esto logramos una cadena de entrega automatizada, reproducible y alineada con el enfoque DevOps."

### Objetivo de esta diapositiva

- Probar automatizacion real.
- Mostrar separacion entre validacion continua y despliegue.

### Transicion

"Durante esa implementacion automatizada tambien encontramos problemas reales, y esos aprendizajes forman parte importante del proyecto."

### Mejorar o quitar

- Si tienes capturas de pipelines exitosos, valdria mucho agregarlas.
- Esta diapositiva debe quedarse.

## Diapositiva 13. Incidencias reales y aprendizajes

### Que decir

"Durante el despliegue real enfrentamos incidencias importantes. Tuvimos restricciones de capacidad y cuota en Azure, limitaciones regionales para PostgreSQL, ajustes de permisos RBAC para Jenkins y correcciones en pipeline y proxy. Esto fue valioso porque nos permitio validar que una implementacion DevOps real no depende solo del codigo, sino tambien de permisos, cuotas, configuracion y adaptacion al entorno cloud."

### Objetivo de esta diapositiva

- Mostrar aprendizaje real.
- Demostrar que hubo despliegue verdadero y no solo teoria.

### Transicion

"A pesar de esas incidencias, logramos resultados concretos tanto en infraestructura como en operacion."

### Mejorar o quitar

- Mantenerla.
- Es una de las diapositivas mas fuertes para defensa academica.

## Diapositiva 14. Resultados obtenidos

### Que decir

"Como resultado, logramos una infraestructura versionada y reproducible, un pipeline automatizado de pruebas y despliegue, y una base operativa con monitoreo, logs y manejo centralizado de secretos. Tambien quedo desplegado un ambiente funcional en Azure Container Apps, con frontend publico y backend interno. En otras palabras, no nos quedamos en prototipo local: llegamos a una solucion operativa en la nube."

### Objetivo de esta diapositiva

- Cerrar con entregables concretos.
- Resaltar el valor tecnico alcanzado.

### Transicion

"A partir de este punto, identificamos recomendaciones para evolucionar el proyecto hacia una version mas robusta."

### Mejorar o quitar

- Si puedes, agregar 2 o 3 metricas concretas haria esta diapositiva mas fuerte.

## Diapositiva 15. Recomendaciones y proximos pasos

### Que decir

"Como siguientes pasos recomendamos completar la promocion hacia test y produccion, reforzar la estrategia de backups y restauracion, incorporar escaneo de imagenes y dependencias, y formalizar alertas y politicas de seguridad para produccion. A nivel de gestion, tambien es importante seguir fortaleciendo documentacion, metricas y procedimientos operativos."

### Objetivo de esta diapositiva

- Mostrar vision de continuidad.
- Probar que el equipo entiende que un piloto no termina en el primer despliegue.

### Transicion

"Finalmente, cerramos con una conclusion general del proyecto."

### Mejorar o quitar

- Mantenerla.
- No alargar demasiado esta parte.

## Diapositiva 16. Cierre

### Que decir

"En conclusion, TI Garantias demuestra una implementacion integral de practicas DevOps: desde el backlog y el desarrollo funcional, hasta la infraestructura como codigo, CI/CD, despliegue en Azure y observabilidad. El principal valor del proyecto no esta solo en la aplicacion, sino en que el proceso completo de entrega quedo mas automatizado, trazable y sostenible. Muchas gracias."

### Objetivo de esta diapositiva

- Dejar una conclusion clara.
- Resumir el valor del proyecto.

### Mejorar o quitar

- Mantenerla breve.
- Si quieres cerrar mas fuerte, puedes usar esta frase final:
  `No solo construimos una aplicacion; construimos una forma mas ordenada, automatizada y observable de entregarla.`

## Que conviene mejorar antes de presentar

- Revisar consistencia de acentos y nombres en toda la presentacion.
- Unificar titulos: usar siempre `TI Garantias - ...` o `TI Garantías - ...`, pero uno solo.
- Corregir nombres de herramientas: `Prometheus`, `SonarQube`, `Key Vault`, `Log Analytics`.
- Si es posible, agregar al menos una evidencia visual extra:
  - captura de pipeline exitoso
  - captura de Azure desplegado
  - captura de Grafana o monitoreo
  - captura del sistema funcionando
- Si falta tiempo, resumir las diapositivas 9 y 11 en menos detalle, pero no eliminarlas.

## Que no conviene quitar

- Gestion del trabajo
- Arquitectura ejecutiva
- Pipeline CI/CD
- Incidencias reales y aprendizajes
- Resultados obtenidos

## Que se podria resumir si el tiempo es corto

- Stack tecnico
- Gestion de backlog
- Inventario de recursos
- Arquitectura C4

## Cierre sugerido de toda la defensa

"En conjunto, el proyecto demuestra que aplicamos DevOps de forma integral: planificamos el trabajo, desarrollamos una aplicacion funcional, automatizamos validaciones y despliegues, desplegamos infraestructura en Azure y habilitamos observabilidad para operar la solucion. Eso convierte a TI Garantias en un piloto tecnico real, no solo en una demostracion teorica."
