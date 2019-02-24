# ngine
just templating

## basic example

<i>partials/list.html</i>
```html
<ul>
  ${mylist.map(color => '<li>${color}</li>')}
</ul>
```

<i>index.html</i>
```html
<html>

  <head>
    <script type="text/javascript" src="../ngine.mini.js"></script>
  </head>

  <body onload="$ngine.render('partials/list.html', {mylist: ['red','green','blue']}, '#mylist'}">

    <div id="mylist"></div>
  
  </body>

</html>
```

## model function example

<i>partials/list.html</i>
```html
<ul>
  ${mylist.map(color => '<li>${color}</li>')}
</ul>
```

<i>index.html</i>
```html
<html>

  <head>
    <script type="text/javascript" src="../ngine.mini.js"></script>

    <script type="text/javascript">
      var models = {
        colors : function() {
          return {mylist: ['red','green','blue']};
        }
      }
    </script>

  </head>

  <body onload="$ngine.render('partials/list.html', models.colors, '#mylist'}">

    <div id="mylist"></div>
  
  </body>

</html>
```


## model & template function example

<i>index.html</i>
```html
<html>

  <head>
    <script type="text/javascript" src="../ngine.mini.js"></script>

    <script type="text/javascript">
      var models = function() {
        colors : function() {
          return {mylist: ['red','green','blue']};
        }
      }

      var templates = {
        list: function() {
          return `
            <ul>
              ${mylist.map(color => '<li>${color}</li>')}
            </ul>
          `;
        }
      }
    </script>

  </head>

  <body onload="$ngine.render(templates.list, models.colors, '#mylist'}">

    <div id="mylist"></div>
  
  </body>

</html>
```
