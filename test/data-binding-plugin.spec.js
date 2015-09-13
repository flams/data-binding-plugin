/**
* @license data-binding-plugin https://github.com/flams/data-binding-plugin
*
* The MIT License (MIT)
*
* Copyright (c) 2014-2015 Olivier Scherrer <pode.fr@gmail.com>
*/

require("quick-dom");

GLOBAL.SVGElement = document.createElementNS("http://www.w3.org/2000/svg", "ellipse").constructor;
GLOBAL.HTMLElement = document.body.constructor;

var DataBindingPlugin = require("../index"),
	Store = require("observable-store"),
	Plugins = require("seam");

describe("data-binding-plugin", function () {
	var dataBindingPlugin = null,
	model = new Store();

	beforeEach(function () {
		dataBindingPlugin = new DataBindingPlugin();
	});

	it("accepts a Store as a model", function () {
		expect(dataBindingPlugin.getModel()).toBeUndefined();
		dataBindingPlugin.setModel(model);
		expect(dataBindingPlugin.getModel()).toBe(model);
	});

	it("initializes the plugin with the given store", function () {
		dataBindingPlugin = new DataBindingPlugin(model);
		expect(dataBindingPlugin.getModel()).toBe(model);
	});
});

describe("bind", function () {

    var plugins = null,
	    model = null,
	    dom = null,
	    dataBindingPlugin = null;

    beforeEach(function () {
        dom = document.createElement("p");

        dom.setAttribute("data-model", "bind:innerHTML,content");
        model = new Store({content: "Olives is fun!"});
        plugins = new Plugins();
        dataBindingPlugin =  new DataBindingPlugin(model);
        plugins.add("model", dataBindingPlugin);
    });

    xit("should link the model and the dom node with bind", function () {
        plugins.apply(dom);
        spyOn(DomUtils, "setAttribute").andCallThrough();
        expect(dom.innerHTML).toBe("Olives is fun!");
        model.set("content", "Olives is cool!");

        expect(dom.innerHTML).toBe("Olives is cool!");
        expect(Array.isArray(dataBindingPlugin.observers.content)).toBe(true);
        expect(model.getValueObservable().hasObserver(dataBindingPlugin.observers.content[0])).toBe(true);

        expect(DomUtils.setAttribute.wasCalled).toBe(true);
        expect(DomUtils.setAttribute.mostRecentCall.args[0]).toBe(dom);
        expect(DomUtils.setAttribute.mostRecentCall.args[1]).toBe("innerHTML");
        expect(DomUtils.setAttribute.mostRecentCall.args[2]).toBe("Olives is cool!");
    });

    it("should not touch the dom if the value isn't set", function () {
        dom.setAttribute("data-model", "bind:innerHTML,content2");
        dom.innerHTML = "hey";
        plugins.apply(dom);
        expect(dom.innerHTML).toBe("hey");
    });

    it("should set up the dom as soon as the value is set", function () {
        dom.setAttribute("data-model", "bind:innerHTML,content2");
        plugins.apply(dom);
        model.set("content2", "sup!");
        expect(dom.innerHTML).toBe("sup!");
    });

    it("should also work with properties", function () {
        var dom = document.createElement("input");
        dom.setAttribute("data-model", "bind:checked,bool");
        model.reset({bool:true});
        plugins.apply(dom);
        expect(dom.checked).toBe(true);
        model.set("bool", false);
        expect(dom.checked).toBe(false);
    });


    xit("should call DomUtils.setAttribute", function () {
        var dom = document.createElement("input");
        dom.setAttribute("data-model", "bind:checked,bool");
        model.reset({bool:true});
        spyOn(DomUtils, "setAttribute").andCallThrough();
        plugins.apply(dom);
        expect(dom.checked).toBe(true);
        model.set("bool", false);
        expect(dom.checked).toBe(false);
        expect(DomUtils.setAttribute.wasCalled).toBe(true);
        expect(DomUtils.setAttribute.mostRecentCall.args[0]).toBe(dom);
        expect(DomUtils.setAttribute.mostRecentCall.args[1]).toBe("checked");
        expect(DomUtils.setAttribute.mostRecentCall.args[2]).toBe(false);
    });

});

describe("DataBindingPluginBindTheOtherWay", function () {

    var plugins = null,
        model = null,
        dom = null;

    beforeEach(function () {
        dom = document.createElement("input");
        dom.setAttribute("data-model", "bind:checked,bool");
        model = new Store({bool:false});
        plugins = new Plugins();
        plugins.add("model", new DataBindingPlugin(model));
    });

    it("should update the model on dom change", function () {
        var func;
        spyOn(dom, "addEventListener");
        plugins.apply(dom);
        expect(dom.addEventListener.wasCalled);
        expect(dom.addEventListener.mostRecentCall.args[0]).toBe("change");
        expect(dom.addEventListener.mostRecentCall.args[2]).toBe(true);
        func = dom.addEventListener.mostRecentCall.args[1];
        dom.checked = true;
        func();
        expect(model.get("bool")).toBe(true);
    });

    it("shouldn't set the item if it was removed, this could happen if the item is removed prior to the trigger of change", function () {
        var func;
        dom.setAttribute("data-model_id", "0");
        spyOn(dom, "addEventListener");
        spyOn(model, "update");
        spyOn(model, "set");
        spyOn(model, "has");
        plugins.apply(dom);
        func = dom.addEventListener.mostRecentCall.args[1];
        model.reset([]);
        func();
        expect(model.has.wasCalled).toBe(true);
        expect(model.has.mostRecentCall.args[0]).toBe('0');
        expect(model.update.wasCalled).toBe(false);
        expect(model.set.wasCalled).toBe(false);
    });

});


describe("DataBindingPluginBindEnhanced", function () {

    var plugins = null,
    model = null,
    dom = null;

    beforeEach(function () {
        dom = document.createElement("div");
        dom.innerHTML = "<strong data-model='bind:innerHTML,name'></strong>" +
        "       <dl>" +
        "           <dt>Mail:</dt><dd data-model='bind:innerHTML,contact.mail'></dd>" +
        "           <dt>Office:</dt><dd data-model='bind:innerHTML,contact.office'></dd>" +
        "           <dt>Mobile:</dt><dd data-model='bind:innerHTML,contact.mobile'></dd>" +
        "       </dl>";
        model = new Store({
            name: "Olives",
            contact: {
                mail: "mailbox@domain.com",
                office: "+1234567890"
            }
        });
        plugins = new Plugins();
        plugins.add("model", new DataBindingPlugin(model));
    });

    it("should also work with complex data", function () {
        plugins.apply(dom);
        expect(dom.querySelectorAll("strong")[0].innerHTML).toBe("Olives");
        expect(dom.querySelectorAll("dd")[0].innerHTML).toBe("mailbox@domain.com");
        expect(dom.querySelectorAll("dd")[1].innerHTML).toBe("+1234567890");
        expect(dom.querySelectorAll("dd")[2].innerHTML).toBe("");
    });

    it("should also be updatable", function () {
        plugins.apply(dom);
        model.set("contact", {office: "-0987654321"});
        expect(dom.querySelectorAll("dd")[1].innerHTML).toBe("-0987654321");
    });

});

describe("DataBindingPluginBindTheOtherWayEnhanced", function () {

    var plugins = null,
    model = null,
    dom = null;

    beforeEach(function () {
        dom = document.createElement("ul");
        dom.setAttribute("data-model", "foreach");
        dom.innerHTML = "<li><input type='checkbox' data-model='bind:checked,optin' />" +
                "       <input type='text' data-model='bind:value,name' /></li>";

        model = new Store([{
                optin: false,
                name: "Emily"
            }, {
                optin: false,
                name: "Olives"
            }]);

        plugins = new Plugins();
        plugins.add("model", new DataBindingPlugin(model));
    });

    xit("should bind from dom to model", function () {
        var checkbox,
            event = document.createEvent("UIEvent");
        plugins.apply(dom);

        event.initEvent("change", true, true, window, 0);

        checkbox = dom.querySelector("input[type='checkbox']");
        checkbox.checked = true;

        checkbox.dispatchEvent(event);

        expect(model.get(0).optin).toBe(true);
    });

});

describe("DataBindingPluginItemRenderer", function () {

    var dataBindingPlugin = null,
        plugins = null,
        rootNode = null;

    beforeEach(function () {
        dataBindingPlugin = new DataBindingPlugin(new Store([0, 1, 2, 3, 4, 5]));
        plugins = {
            name: "model",
            apply: jasmine.createSpy()
        };
        rootNode = document.createElement("div");
    });

    it("should provide an item renderer", function () {
        expect(typeof dataBindingPlugin.ItemRenderer).toBe("function");
    });

    it("should set the node to render", function () {
        var itemRenderer = new dataBindingPlugin.ItemRenderer(),
            div = document.createElement("div");

        expect(itemRenderer.setRenderer(div)).toBe(true);
        expect(itemRenderer.getRenderer()).toBe(div);
    });

    it("should set the root node where to attach created nodes and set item renderer", function () {
        var rootNode = document.createElement("div"),
            p = document.createElement("p"),
            itemRenderer;

        rootNode.appendChild(p);
        spyOn(rootNode, "removeChild").andCallThrough();
        itemRenderer = new dataBindingPlugin.ItemRenderer();

        spyOn(itemRenderer, "setRenderer").andCallThrough();

        itemRenderer.setRootNode(rootNode);
        expect(itemRenderer.getRootNode()).toBe(rootNode);

        expect(itemRenderer.setRenderer.wasCalled).toBe(true);
        expect(itemRenderer.setRenderer.mostRecentCall.args[0]).toBe(p);

        expect(rootNode.removeChild.wasCalled).toBe(true);
        expect(rootNode.removeChild.mostRecentCall.args[0]).toBe(p);

    });

    it("shouldn't fail if rootNode has no children", function () {
        var itemRenderer = new dataBindingPlugin.ItemRenderer();
        expect(function () {
            itemRenderer.setRootNode(rootNode);
        }).not.toThrow();
    });

    it("should set plugins", function () {
        var itemRenderer = new dataBindingPlugin.ItemRenderer();
        expect(itemRenderer.setPlugins(plugins)).toBe(true);
        expect(itemRenderer.getPlugins()).toBe(plugins);
    });

    it("should have a function to create items", function () {
        var div = document.createElement("div"),
            itemRenderer,
            node;

        rootNode.appendChild(div);
        itemRenderer = new dataBindingPlugin.ItemRenderer(plugins, rootNode);

        div.innerHTML = '<p><span>date:</span><span data-model="bind:innerHTML,date"></span></p>' +
        '<p><span>title:</span><span data-model="bind:innerHTML,title"></span></p>';

        node = itemRenderer.create(0);
        expect(node.nodeName).toBe("DIV");
        expect(node.querySelectorAll("*").length).toBe(6);

        expect(node.querySelectorAll("[data-model]")[0].getAttribute("data-model_id")).toBe('0');
        expect(node.querySelectorAll("[data-model]")[1].getAttribute("data-model_id")).toBe('0');
        expect(node.querySelectorAll("[data-model_id]").length).toBe(6);
    });

    it("should call plugins.apply on item create", function () {
        var ul = document.createElement("ul"),
            itemRenderer,
            item;

        rootNode.appendChild(ul);
        itemRenderer = new dataBindingPlugin.ItemRenderer(plugins, rootNode);
        item = itemRenderer.create(0);

        expect(plugins.apply.wasCalled).toBe(true);
        expect(plugins.apply.mostRecentCall.args[0]).toBe(item);

    });

    it("should return a cloned node", function () {
        var div = document.createElement("div"),
            itemRenderer;

        rootNode.appendChild(div);
        itemRenderer = new dataBindingPlugin.ItemRenderer(plugins, rootNode);

        expect(itemRenderer.create(0)).not.toBe(div);
    });

    it("should set the item renderer at init", function () {
        var div = document.createElement("div"),
            itemRenderer;

        rootNode.appendChild(div);
        itemRenderer = new dataBindingPlugin.ItemRenderer(plugins, rootNode);

        expect(itemRenderer.getRenderer()).toBe(div);
    });

    it("should set plugins at init", function () {
        var div = document.createElement("div"),
            itemRenderer;

        rootNode.appendChild(div);
        itemRenderer = new dataBindingPlugin.ItemRenderer(plugins, rootNode);

        expect(itemRenderer.getPlugins()).toBe(plugins);
    });

    it("should set rootnode at init", function () {
        var div = document.createElement("div"),
            itemRenderer;

        rootNode.appendChild(div);
        itemRenderer = new dataBindingPlugin.ItemRenderer(plugins, rootNode);
        expect(itemRenderer.getRootNode()).toBe(rootNode);
    });

    it("should have a function to get/set start", function () {
        var itemRenderer = new dataBindingPlugin.ItemRenderer();
        expect(itemRenderer.setStart(0)).toBe(0);
        expect(itemRenderer.setStart("5")).toBe(5);
        expect(itemRenderer.getStart()).toBe(5);
    });

    it("should have a function to get/set nb", function () {
        var itemRenderer = new dataBindingPlugin.ItemRenderer();
        expect(itemRenderer.setNb(0)).toBe(0);
        expect(itemRenderer.setNb("5")).toBe(5);
        expect(itemRenderer.getNb()).toBe(5);
        expect(itemRenderer.setNb("*")).toBe("*");
        expect(itemRenderer.getNb()).toBe("*");
    });

    it("should have a store to store items", function () {
        var dom = document.createElement("ul"),
            itemRenderer;

        rootNode.appendChild(dom);
        itemRenderer = new dataBindingPlugin.ItemRenderer(plugins, rootNode);
        expect(typeof itemRenderer.items).toBe("object");
    });

    it("should store created items in the store", function () {
        var ul = document.createElement("ul"),
            item,
            itemRenderer;

        rootNode.appendChild(ul);
        itemRenderer = new dataBindingPlugin.ItemRenderer(plugins, rootNode);

        item = itemRenderer.create(0);
        expect(itemRenderer.items[0]).toBe(item);
    });

    it("should have a function to add an item", function () {
        var dom = document.createElement("p"),
            itemRenderer;

        rootNode.appendChild(dom);
        itemRenderer = new dataBindingPlugin.ItemRenderer(plugins, rootNode);
        spyOn(rootNode, "appendChild").andCallThrough();
        spyOn(itemRenderer, "create").andCallThrough();

        expect(itemRenderer.addItem()).toBe(false);
        expect(itemRenderer.addItem({})).toBe(false);
        expect(itemRenderer.addItem(1)).toBe(true);

        expect(itemRenderer.create.wasCalled).toBe(true);
        expect(itemRenderer.create.mostRecentCall.args[0]).toBe(1);

        expect(rootNode.appendChild.wasCalled).toBe(true);
        expect(rootNode.appendChild.mostRecentCall.args[0]).toBe(itemRenderer.items[1]);
        expect(rootNode.appendChild.mostRecentCall.args[1]).toBe(itemRenderer.items[2]);
    });

    it("should not add an item that is already created", function () {
        var dom = document.createElement("p"),
            itemRenderer;

        rootNode.appendChild(dom);
        itemRenderer = new dataBindingPlugin.ItemRenderer(plugins, rootNode);
        spyOn(itemRenderer, "create").andCallThrough();

        expect(itemRenderer.addItem(1)).toBe(true);
        expect(itemRenderer.create.callCount).toBe(1);

        expect(itemRenderer.addItem(1)).toBe(false);
        expect(itemRenderer.create.callCount).toBe(1);

    });

    it("should have a function to get the next item", function () {
        var dom = document.createElement("p"),
            itemRenderer;

        rootNode.appendChild(dom);
        itemRenderer = new dataBindingPlugin.ItemRenderer(plugins, rootNode);

        expect(itemRenderer.getNextItem(0)).toBeUndefined();
        itemRenderer.addItem(3);
        expect(itemRenderer.getNextItem(0)).toBe(itemRenderer.items[3]);
        expect(itemRenderer.getNextItem(2)).toBe(itemRenderer.items[3]);
        expect(itemRenderer.getNextItem(3)).toBeUndefined();
    });

    it("should add an item at the correct position even if it's not directly followed by another one", function () {
        var dom = document.createElement("p"),
            itemRenderer;

        rootNode.appendChild(dom);
        itemRenderer = new dataBindingPlugin.ItemRenderer(plugins, rootNode);

        itemRenderer.addItem(2);
        itemRenderer.addItem(0);
        expect(rootNode.querySelectorAll("p")[0].getAttribute("data-model_id")).toBe("0");
        expect(rootNode.querySelectorAll("p")[1].getAttribute("data-model_id")).toBe("2");
    });

    it("should'nt try to add an item that doesn't exist", function () {
        var dom = document.createElement("p"),
        itemRenderer;

        rootNode.appendChild(dom);
        itemRenderer = new dataBindingPlugin.ItemRenderer(plugins, rootNode);

        expect(function () {
            itemRenderer.addItem(-1);
        }).not.toThrow();

        expect(itemRenderer.addItem(-1)).toBe(false);
    });

    it("should have a function to remove an item", function () {
        var dom = document.createElement("p"),
            itemRenderer,
            item;

        rootNode.appendChild(dom);
        itemRenderer = new dataBindingPlugin.ItemRenderer(plugins, rootNode);
        spyOn(rootNode, "removeChild").andCallThrough();

        expect(itemRenderer.removeItem()).toBe(false);
        expect(itemRenderer.removeItem({})).toBe(false);
        expect(itemRenderer.removeItem(1)).toBe(false);

        itemRenderer.addItem(1);

        item = itemRenderer.items[1];

        expect(itemRenderer.removeItem(1)).toBe(true);
        expect(rootNode.removeChild.wasCalled).toBe(true);
        expect(rootNode.removeChild.mostRecentCall.args[0]).toBe(item);

        expect(itemRenderer.items[0]).toBeUndefined();
    });

    it("shouldn't create an item if it doesn't exist in the model", function () {
        var ul = document.createElement("ul"),
            item,
            itemRenderer;

        rootNode.appendChild(ul);
        itemRenderer = new dataBindingPlugin.ItemRenderer(plugins, rootNode);

        item = itemRenderer.create(10);
        expect(item).toBeUndefined();
        expect(itemRenderer.items[10]).toBeUndefined();
    });

    it("should allow for populating the rootNode with items on render", function () {
        var item = document.createElement("p"),
            itemRenderer;

        rootNode.appendChild(item);
        itemRenderer = new dataBindingPlugin.ItemRenderer(plugins, rootNode);

        spyOn(itemRenderer, "addItem").andCallThrough();
        spyOn(itemRenderer, "removeItem");

        expect(itemRenderer.render()).toBe(false);
        itemRenderer.setNb(3);
        itemRenderer.setStart(1);
        expect(itemRenderer.render()).toBe(true);

        expect(itemRenderer.addItem.callCount).toBe(3);
        expect(itemRenderer.addItem.calls[0].args[0]).toBe(1);
        expect(rootNode.querySelectorAll("p").length).toBe(3);
    });

    it("should update rendering when the limits change", function () {
        var item = document.createElement("p"),
            itemRenderer;

        rootNode.appendChild(item);
        itemRenderer = new dataBindingPlugin.ItemRenderer(plugins, rootNode);
        itemRenderer.setNb(3);
        itemRenderer.setStart(0);
        itemRenderer.render();

        spyOn(itemRenderer, "addItem").andCallThrough();
        spyOn(itemRenderer, "removeItem").andCallThrough();

        itemRenderer.setStart(2);
        itemRenderer.render();

        expect(itemRenderer.addItem.wasCalled).toBe(true);
        expect(itemRenderer.addItem.mostRecentCall.args[0]).toBe(4);
        expect(itemRenderer.removeItem.wasCalled).toBe(true);
        // The items must be removed from the highest id to the lowest
        // so the ids don't change during the removal process
        expect(itemRenderer.removeItem.calls[0].args[0]).toBe(1);
        expect(itemRenderer.removeItem.calls[1].args[0]).toBe(0);
    });

    it("should update rendering when an item is removed", function () {
        var item = document.createElement("p"),
            itemRenderer;

        rootNode.appendChild(item);
        itemRenderer = new dataBindingPlugin.ItemRenderer(plugins, rootNode);

        itemRenderer.setNb("*");
        itemRenderer.setStart(0);
        spyOn(itemRenderer, "removeItem").andCallThrough();
        // First rendering with the 6 elements
        itemRenderer.render();
        // Remove the first one
        dataBindingPlugin.getModel().del(0);
        // And the rendering should be updated
        itemRenderer.render();
        // There are now 5 items
        expect(rootNode.querySelectorAll("p").length).toBe(5);
        // Because removeItem was called once
        expect(itemRenderer.removeItem.callCount).toBe(1);
        // to remove item with index 5.
        // 5?? yes! the items from 0 to 4 are updated, the 5 is deleted!
        expect(itemRenderer.removeItem.mostRecentCall.args[0]).toBe(5);

        itemRenderer.removeItem.reset();

        // Deletes item 0, 1, 2
        dataBindingPlugin.getModel().alter("splice", 0, 3);
        // which should remove 3 dom nodes
        itemRenderer.render();

        expect(itemRenderer.removeItem.callCount).toBe(3);
        expect(itemRenderer.removeItem.calls[2].args[0]).toBe(2);
        expect(itemRenderer.removeItem.calls[1].args[0]).toBe(3);
        expect(itemRenderer.removeItem.calls[0].args[0]).toBe(4);

    });
});

describe("DataBindingPluginForeach", function () {
    var dataBindingPlugin = null,
    model = null,
    dom = null,
    plugins = null;

    beforeEach(function () {
        dom = document.createElement("ul");

        dom.setAttribute("data-model", "foreach");
        dom.innerHTML = '<li data-model="bind:innerHTML"></li>';

        model = new Store(["Olives", "is", "fun"]);
        dataBindingPlugin = new DataBindingPlugin(model);
        plugins = new Plugins();
        plugins.add("model", dataBindingPlugin);
    });

    it("should expand the node inside", function () {
        plugins.apply(dom);
        expect(dom.querySelectorAll("li").length).toBe(3);
        expect(dom.querySelectorAll("li")[0].getAttribute("data-model_id")).toBe("0");
        expect(dom.querySelectorAll("li")[1].getAttribute("data-model_id")).toBe("1");
        expect(dom.querySelectorAll("li")[2].getAttribute("data-model_id")).toBe("2");
    });

    it("should'nt do anything if no inner node declared", function () {
        var dom = document.createElement("div");

        expect(function () {
            plugins.apply(dom);
        }).not.toThrow();
        expect(dom.querySelectorAll("*").length).toBe(0);
    });

    it("should associate the model with the dom nodes", function () {
        plugins.apply(dom);
        expect(dom.querySelectorAll("li")[0].innerHTML).toBe("Olives");
        expect(dom.querySelectorAll("li")[1].innerHTML).toBe("is");
        expect(dom.querySelectorAll("li")[2].innerHTML).toBe("fun");
        expect(dom.querySelectorAll("li").length).toBe(3);
    });

    it("should update the generated dom when the model is updated", function () {
        plugins.apply(dom);
        model.set(0, "Olives and Emily");
        expect(dom.querySelectorAll("li")[0].innerHTML).toBe("Olives and Emily");
        model.set(1, "are");
        expect(dom.querySelectorAll("li")[1].innerHTML).toBe("are");
        model.alter("splice", 2, 0, "very");
        expect(dom.querySelectorAll("li")[2].innerHTML).toBe("very");
        expect(dom.querySelectorAll("li")[3].innerHTML).toBe("fun");
        expect(dom.querySelectorAll("li").length).toBe(4);
    });

    it("should remove an item if it's removed from the model", function () {
        plugins.apply(dom);
        model.alter("pop");
        expect(dom.querySelectorAll("li")[2]).toBeUndefined();
    });

    it("should remove the observers of the removed item", function () {
        var handler;
        plugins.apply(dom);
        handler = dataBindingPlugin.observers[2][0];
        model.alter("pop");
        expect(model.getValueObservable().hasObserver(handler)).toBe(false);
        expect(dataBindingPlugin.observers[2]).toBeUndefined();
    });

    it("should not fail if the ItemRenderer is given a DOM that starts with a textnode", function () {
        dom.innerHTML = " \n \t\t <li></li>";
        spyOn(dataBindingPlugin, "ItemRenderer").andCallThrough();
        expect(function () {
            plugins.apply(dom);
        }).not.toThrow();
        expect(dom.querySelectorAll("li").length).toBe(3);
    });

    it("should have a function for getting the item index in a store given a dom element", function () {
        plugins.apply(dom);
        expect(dataBindingPlugin.getItemIndex(document.createElement("li"))).toBe(false);
        expect(dataBindingPlugin.getItemIndex(dom.querySelector("li"))).toBe(0);
        expect(dataBindingPlugin.getItemIndex(dom.querySelectorAll("li")[2])).toBe(2);
    });
});

describe("DataBindingPluginForeachEnhanced", function () {

    var dataBindingPlugin = null,
    model = null,
    dataSet = null,
    dom = null,
    plugins = null;

    beforeEach(function () {
        dom = document.createElement("ul");
        dom.setAttribute("data-model_id", "foreach");

        dataSet = [{value : {
            title: "Olives is cool",
            date: "2012/01/20",
            body: "it's very flexible"
        }},

        {value: {
            title: "Olives is fun",
            date: "2012/01/21",
            body: "you can cut its hair"
        }},

        {value: {
            title: "Olives is nice",
            date: "2012/01/22",
            body: "you ... no"
        }}
        ];
        model = new Store(dataSet);
        dataBindingPlugin = new DataBindingPlugin(model);

        plugins = new Plugins();
        plugins.add("model", dataBindingPlugin);
    });

    it("should expand and fill in with a complex object's values", function () {
        dom.innerHTML = '<li><em data-model="bind:innerHTML,value.date"></em><strong data-model="bind:innerHTML,value.title"></strong>' +
        '<span data-model="bind:innerHTML,value.body"></span></li>';

        dataBindingPlugin.foreach(dom);
        expect(dom.querySelectorAll("li").length).toBe(3);
        expect(dom.querySelectorAll("em")[0].innerHTML).toBe(dataSet[0].value.date);
        expect(dom.querySelectorAll("strong")[0].innerHTML).toBe(dataSet[0].value.title);
        expect(dom.querySelectorAll("span")[0].innerHTML).toBe(dataSet[0].value.body);

        expect(dom.querySelectorAll("em")[1].innerHTML).toBe(dataSet[1].value.date);
        expect(dom.querySelectorAll("strong")[1].innerHTML).toBe(dataSet[1].value.title);
        expect(dom.querySelectorAll("span")[1].innerHTML).toBe(dataSet[1].value.body);

        expect(dom.querySelectorAll("em")[2].innerHTML).toBe(dataSet[2].value.date);
        expect(dom.querySelectorAll("strong")[2].innerHTML).toBe(dataSet[2].value.title);
        expect(dom.querySelectorAll("span")[2].innerHTML).toBe(dataSet[2].value.body);
    });

    it("should update such expanded list", function () {
        dom.innerHTML = '<li><em data-model="bind:innerHTML,value.date"></em><strong data-model="bind:innerHTML,value.title"></strong>' +
        '<span data-model="bind:innerHTML,value.body"></span></li>';

        dataBindingPlugin.foreach(dom);

        model.set(1, {
            value: {
                title: "Olives is fantastic",
                date: "2012/01/24",
                body: "innit"
            }
        });
        expect(dom.querySelectorAll("em")[1].innerHTML).toBe("2012/01/24");
        expect(dom.querySelectorAll("strong")[1].innerHTML).toBe("Olives is fantastic");
        expect(dom.querySelectorAll("span")[1].innerHTML).toBe("innit");
    });


});

describe("DataBindingPluginNestedForeach", function () {

    var dataBindingPlugin = null,
    model = null,
    dom = null,
    plugins = null;

    beforeEach(function () {
        dom = document.createElement("ul");
        dom.innerHTML = '<li>' +
                            '<span data-model="bind:innerHTML,name"></span>' +
                            '<ul data-model="foreach:plugins">' +
                                '<li data-model_id="plugins" data-model="bind:innerHTML"></li>' +
                            '</ul>' +
                        '</li>';

        model = new Store([{
            name:"emily",
            plugins: ["Store", "Observable", "StateMachine"]
        }, {
            name:"olives",
            plugins: ["OObject", "DataBindingPlugin", "Plugins"]
        }]);
        dataBindingPlugin = new DataBindingPlugin(model);
        plugins = new Plugins();
        plugins.add("model", dataBindingPlugin);
    });

    it("should render nested foreach", function () {
        dataBindingPlugin.foreach(dom, "fwks");
        // Nested for each are not supported yet. Should be done by April
    });


});


describe("DataBindingPluginForeachLimits", function () {

    var dataBindingPlugin = null,
        model = null,
        dataSet = null,
        dom = null,
        plugins = null;

    beforeEach(function () {
        dom = document.createElement("ul");
        dom.innerHTML = "<li data-model='bind:innerHTML'></li>";

        dataSet = ["Olives", "is", "cool", "it handles", "pagination", "for me"];
        model = new Store(dataSet);
        dataBindingPlugin = new DataBindingPlugin(model);

        plugins = new Plugins();
        plugins.add("model", dataBindingPlugin);
    });

    it("should limit the list length to the given params", function () {
        dataBindingPlugin.foreach(dom, "id", 1, 3);
        expect(dom.querySelectorAll("li").length).toBe(3);
        expect(dom.querySelectorAll("li")[0].innerHTML).toBe("is");
        expect(dom.querySelectorAll("li")[1].innerHTML).toBe("cool");
        expect(dom.querySelectorAll("li")[2].innerHTML).toBe("it handles");
    });

    it("should not fail with outbounds values", function () {
        dataBindingPlugin.foreach(dom, "id", -1, 7);
        expect(dom.querySelectorAll("li").length).toBe(6);
        expect(dom.querySelectorAll("li")[0].innerHTML).toBe("Olives");
        expect(dom.querySelectorAll("li")[5].innerHTML).toBe("for me");
    });

    it("should not add a new item if it's out of the limits", function () {
        dataBindingPlugin.foreach(dom, "id", 2, 3);
        model.alter("push", "new item out of the limits");
        expect(dom.querySelectorAll("li").length).toBe(3);
    });

    it("should not fail if an item is removed", function() {
        dataBindingPlugin.foreach(dom, "id", 2, 3);
        model.alter("push", "new item out of the limits");
        model.alter("pop");
        expect(dom.querySelectorAll("li").length).toBe(3);
        model.del(2);
        expect(dom.querySelectorAll("li")[0].innerHTML).toBe("it handles");
    });

    it("should store the item renderers according to their id", function () {
        var itemRenderer;
        spyOn(dataBindingPlugin, "setItemRenderer").andCallThrough();

        dataBindingPlugin.foreach(dom, "id", 2, 3);
        expect(dataBindingPlugin.setItemRenderer.mostRecentCall.args[0]).toBe("id");
        itemRenderer = dataBindingPlugin.setItemRenderer.mostRecentCall.args[1];
        expect(itemRenderer instanceof dataBindingPlugin.ItemRenderer).toBe(true);
        expect(dataBindingPlugin.getItemRenderer("id")).toBe(itemRenderer);
    });

    it("should save the store as default if no id is given", function () {
        var itemRenderer;
        spyOn(dataBindingPlugin, "setItemRenderer").andCallThrough();

        dataBindingPlugin.foreach(dom);
        itemRenderer = dataBindingPlugin.setItemRenderer.mostRecentCall.args[1];
        expect(dataBindingPlugin.getItemRenderer("default")).toBe(itemRenderer);
    });

    it("should allow for multiple foreaches", function () {
        var dom2 = dom.cloneNode(true);
        dataBindingPlugin.foreach(dom, "id", 1, 3);
        dataBindingPlugin.foreach(dom2, "id2", 3, 3);

        expect(dom2.querySelectorAll("li").length).toBe(3);
        expect(dom.querySelectorAll("li")[0].innerHTML).toBe("is");
        expect(dom2.querySelectorAll("li")[0].innerHTML).toBe("it handles");
    });

    it("should update the foreach start", function () {
        var itemRenderer;
        dataBindingPlugin.foreach(dom, "id", 1, 3);
        itemRenderer = dataBindingPlugin.getItemRenderer("id");
        expect(dataBindingPlugin.updateStart("fakeId")).toBe(false);
        expect(dataBindingPlugin.updateStart("id", 2)).toBe(true);
        expect(itemRenderer.getStart()).toBe(2);
    });

    it("should update the nb of items displayed by foreach", function () {
        var itemRenderer;
        dataBindingPlugin.foreach(dom, "id", 1, 3);
        itemRenderer = dataBindingPlugin.getItemRenderer("id");
        expect(dataBindingPlugin.updateNb("fakeId")).toBe(false);
        expect(dataBindingPlugin.updateNb("id", 2)).toBe(true);
        expect(itemRenderer.getNb()).toBe(2);
    });

    it("should have a function to call itemRenderer's render", function () {
        var itemRenderer;
        dataBindingPlugin.foreach(dom, "id", 1, 3);
        itemRenderer = dataBindingPlugin.getItemRenderer("id");
        spyOn(itemRenderer, "render");

        expect(dataBindingPlugin.refresh("fakeid")).toBe(false);
        expect(dataBindingPlugin.refresh("id")).toBe(true);
        expect(itemRenderer.render.wasCalled).toBe(true);
    });

});

describe("ModelForm", function () {

    var dataBindingPlugin = null,
    plugins = null,
    model = null,
    form = null;

    beforeEach(function () {
        model = new Store();
        dataBindingPlugin = new DataBindingPlugin(model);
        plugins = new Plugins();
        plugins.add("model", dataBindingPlugin);
        form = document.createElement("form");
        form.innerHTML = '<p><label>Firstname: </label><input type="text" name="firstname" value="olivier" /></p>' +
        '<p><label>Lastname: </label><input type="text" name="lastname" value="wietrich" /></p>' +
        '<p><label>Age: </label><input type="number" step="1" min="0" max="99" name="age" value="25" /></p>' +
        '<p><label>Job: </label><input type="text" name="job" value="engineer" /></p>' +
        '<p><button type="submit">ok</button></p>';
        form.setAttribute("data-model", "form");
    });

    it("should have a set function to set the model from form values", function () {
        var input = document.createElement("input");
        input.type = "text";
        input.name = "firstname";
        input.value = "olivier";
        expect(dataBindingPlugin.set(document.createElement("input"))).toBe(false);
        expect(dataBindingPlugin.set(input)).toBe(true);
        expect(model.get("firstname")).toBe("olivier");
    });

    it("should accept only form nodes", function () {
        expect(dataBindingPlugin.form()).toBe(false);
        expect(dataBindingPlugin.form(document.createElement("div"))).toBe(false);
        expect(dataBindingPlugin.form(form)).toBe(true);
    });

    it("should make form listen to submit", function () {
        spyOn(form, "addEventListener").andCallThrough();
        spyOn(dataBindingPlugin, "set");

        dataBindingPlugin.form(form);

        expect(form.addEventListener.wasCalled).toBe(true);
        expect(form.addEventListener.mostRecentCall.args[0]).toBe("submit");
        expect(form.addEventListener.mostRecentCall.args[2]).toBe(true);

    });

    it("should call set on submit and prevent the real submit to avoid the page to be refreshed", function () {
        var func,
        event = {
                preventDefault: jasmine.createSpy()
        };
        spyOn(form, "addEventListener").andCallThrough();
        spyOn(dataBindingPlugin, "set");

        dataBindingPlugin.form(form);
        func = form.addEventListener.mostRecentCall.args[1];

        func(event);

        expect(dataBindingPlugin.set.wasCalled).toBe(true);
        expect(dataBindingPlugin.set.callCount).toBe(4);
        expect(event.preventDefault.wasCalled).toBe(true);
    });
});

describe("DataBindingPluginPlugins", function () {

    var dataBindingPlugin = null,
        model = null,
        newBindings = null,
        dom = null;

    beforeEach(function () {
        model = new Store({"property": false});
        newBindings = {
            toggleClass: jasmine.createSpy()
        };
        dataBindingPlugin = new DataBindingPlugin(model);
        dataBindingPlugin.plugins = {}; dataBindingPlugin.plugins.name = "model";
        dom = document.createElement("div");
    });

    it("should add a new binding", function () {
        expect(dataBindingPlugin.addBinding("")).toBe(false);
        expect(dataBindingPlugin.addBinding("", {})).toBe(false);
        expect(dataBindingPlugin.addBinding("", function () {})).toBe(false);
        expect(dataBindingPlugin.addBinding("toggleClass", newBindings.toggleClass)).toBe(true);
        expect(dataBindingPlugin.getBinding("toggleClass")).toBe(newBindings.toggleClass);
    });

    it("should add multiple bindings at once", function () {
        spyOn(dataBindingPlugin, "addBinding").andCallThrough();
        dataBindingPlugin.addBindings(newBindings);
        expect(dataBindingPlugin.addBinding.wasCalled).toBe(true);
        expect(dataBindingPlugin.addBinding.mostRecentCall.args[0]).toBe("toggleClass");
        expect(dataBindingPlugin.addBinding.mostRecentCall.args[1]).toBe(newBindings.toggleClass);
    });

    it("should tell if binding exists", function () {
        dataBindingPlugin.addBindings(newBindings);
        expect(dataBindingPlugin.hasBinding("toggleClass")).toBe(true);
        expect(dataBindingPlugin.hasBinding("valueOf")).toBe(false);
    });

    it("should execute binding", function () {
        expect(dataBindingPlugin.execBinding(dom, "nop", false)).toBe(false);
        dataBindingPlugin.addBindings(newBindings);
        expect(dataBindingPlugin.execBinding(dom, "toggleClass", false, "otherParam")).toBe(true);
        expect(newBindings.toggleClass.mostRecentCall.args[0]).toBe(false);
        expect(newBindings.toggleClass.mostRecentCall.args[1]).toBe("otherParam");
        expect(newBindings.toggleClass.mostRecentCall.object).toBe(dom);
    });

    it("should execute new bindings", function () {
        dataBindingPlugin.addBindings(newBindings);
        spyOn(dataBindingPlugin, "execBinding");
        dataBindingPlugin.bind(dom, "toggleClass","property", "otherParam");
        model.set("property", true);
        expect(dataBindingPlugin.execBinding.wasCalled).toBe(true);
        expect(dataBindingPlugin.execBinding.mostRecentCall.args[0]).toBe(dom);
        expect(dataBindingPlugin.execBinding.mostRecentCall.args[1]).toBe("toggleClass");
        expect(dataBindingPlugin.execBinding.mostRecentCall.args[2]).toBe(true);
        expect(dataBindingPlugin.execBinding.mostRecentCall.args[3]).toBe("otherParam");
    });

    it("should not double way bind the plugins", function () {
        dataBindingPlugin.addBindings(newBindings);
        spyOn(dom, "addEventListener").andCallThrough();
        dataBindingPlugin.bind(dom, "toggleClass","property");
        expect(dom.addEventListener.wasCalled).toBe(false);
    });

    it("should add bindings at DataBindingPlugin init", function () {
        var dataBindingPlugin = new DataBindingPlugin(model, newBindings);

        expect(dataBindingPlugin.getBinding("toggleClass")).toBe(newBindings.toggleClass);
    });

});
