Data binding
=============

One of the most powerful two-way data-binding tools available. It has a bunch of really cool features:

- It can be extended with plugins so that virtually any behavior can be triggered on model update.
- It can generate DOM elements for you based on a pure HTML template and repeat them to render a list of items.
- The rendering of lists of items can be virtualized so that not all of the items get rendered, improving performance and memory consumption.
- It's so fast that it's the perfect tool for mobile devices too.
- It's extensively tested to prevent memory leaks.
- It's really to use as it's a plugin for [Seam](https://github.com/flams/seam), which is the simplest way to attach behavior to an HTML template.
- It even works with SVGs!

Installation
============

```bash
npm install data-binding-plugin
```

How to use
==========

Require data-binding-plugin:

```js
var DataBinding = require("data-binding-plugin");
```

The data-binding plugin binds the data from a model with an HTML view.

Initialize data-binding:

```js
var dataBinding = new DataBinding();
```

Give it a model (an observable-store)

```js
var Store = require("observable-store");
var store = new Store({
    name: "data-binding"
});
```

Give the store to the data-binding plugin:

```js
dataBinding.setModel(store);
```

The data-binding is a Seam plugin, so we need to new up Seam and add the plugin to it:


```js
var Seam = require("seam");
var seam = new Seam();

seam.add("bind", dataBinding);
```

Now we can define the view. Whenever the name property is updated in the store, the innerHTML property of the DIV element is set with the value.

```html
<div data-bind="bind: innerHTML, name"> </div>
```

And apply the data-binding plugin to the view.

```js
seam.apply(document.querySelector('[data-bind]'));
```

When the store is updated, the view will reflect the change:

```js
store.set('name', 'data-binding-plugin');
```





LICENSE
=======

MIT
