// custom crafted control for this one project
// a layer toggler that floats in the corner; no legends, plain checkbox, expand/collapse
L.Control.LayerPicker = L.Control.extend({
	options: {
		position: 'bottomright',
        expanded: false,
        layers: [],
		onLayerChange: function () {},
		control_id: "leaflet-control-layerpicker-content",
	},
	initialize: function(options) {
		L.setOptions(this,options);
	},
	onAdd: function (map) {
		this._map = map;

		// create our container
		this.container = L.DomUtil.create('div', 'leaflet-control leaflet-bar leaflet-layerpicker-control leaflet-layerpicker-collapsed');
        this.container.role = 'group';
        this.container.setAttribute('aria-labelledby', `${this.options.control_id}-heading`);

		const opener = L.DomUtil.create('div', 'leaflet-layerpicker-button', this.container);
		opener.innerHTML = '<button type="button" aria-label="Show layers to be displayed on the map"><i class="fa fa-layer-group"></i></button>';
		this.openbutton = opener.querySelector('button');
        this.openbutton.setAttribute('aria-controls', this.options.control_id);

        // expanded content
		this.content_expanded = L.DomUtil.create('div', 'leaflet-layerpicker-content', this.container);
		this.content_expanded.id = this.options.control_id;

        // close button
        const closer = L.DomUtil.create('div', 'leaflet-layerpicker-closebutton', this.content_expanded);
        closer.innerHTML = '<button type="button" aria-label="Close reference layers">&times;</button>';
        this.closebutton = closer.querySelector('button');
        this.closebutton.setAttribute('aria-controls', this.options.control_id);

        // head text
        this.headtext = L.DomUtil.create('h3', 'leaflet-layerpicker-headtext', this.content_expanded);
        this.headtext.innerHTML = 'Reference Layers';
        this.headtext.id = `${this.options.control_id}-heading`;

        // layer checkboxes
        // create them, their labels, etc. and also a registry of these for random access e.g. toggleLayer()
        this.layercheckboxes = {};
        this.options.layers.forEach((layerinfo) => {
            const entry = L.DomUtil.create('label', 'leaflet-layerpicker-layerentry', this.content_expanded);

            const checkbox = L.DomUtil.create('input', 'leaflet-layerpicker-checkbox', entry);
            checkbox.type = 'checkbox';
            checkbox.value = layerinfo.id;
            checkbox.setAttribute('aria-label', `Toggle map layer ${layerinfo.label}`);

            const label = L.DomUtil.create('span', 'leaflet-layerpicker-name', entry);
            label.innerHTML = layerinfo.label;

            // click to do stuff
            L.DomEvent.addListener(checkbox, 'change', () => {
                this.toggleLayer(checkbox.value, checkbox.checked);
            });

            // log to the registry
            this.layercheckboxes[layerinfo.id] = {
				id: layerinfo.id,
				label: layerinfo.label,
                maplayer: layerinfo.layer,
                checkbox: checkbox,
            };

			// afterthought: if this layer should be checked (and thus turned on) do so now
			if (layerinfo.checked) {
				checkbox.checked = true;
				this.toggleLayer(checkbox.value, checkbox.checked);
			}
        });

		// stop mouse events from falling through (Leaflet 1.x)
        L.DomEvent.disableClickPropagation(this.container);
        L.DomEvent.disableScrollPropagation(this.container);

		// click X to close & click closed version to open
        // ARIA/508 translate hitting enter as clicking
		L.DomEvent.addListener(this.openbutton, 'keydown', (event) => {
            if (event.key != 'Enter') return;

            setTimeout(() => {
                this.openbutton.click();
            }, 0.1 * 1000);
		});
		L.DomEvent.addListener(this.closebutton, 'keydown', (event) => {
            if (event.key != 'Enter') return;

            setTimeout(() => {
                this.closebutton.click();
            }, 0.1 * 1000);
		});

		L.DomEvent.addListener(this.openbutton, 'click', () => {
			this.expand();

            // then focus the close button, so keyboard users are in the same place as they were
            this.closebutton.focus();
		});
		L.DomEvent.addListener(this.closebutton, 'click', () => {
			this.collapse();

            // then focus the open button, so keyboard users are in the same place as they were
            this.openbutton.focus();
		});

        if (this.options.expanded) {
            setTimeout(() => {
                this.expand();
            }, 0.5 * 1000);
        }

		// enable keyboard interactions
        if (this._map.options.keyboard) {
            this.openbutton.tabIndex = 0;
			this.closebutton.tabIndex = 0;
        }

		// all done
		return this.container;
	},
	expand: function (html) {
		L.DomUtil.addClass(this.container, 'leaflet-layerpicker-expanded');
		L.DomUtil.removeClass(this.container, 'leaflet-layerpicker-collapsed');

        this.closebutton.setAttribute('aria-expanded', 'true');
        this.openbutton.setAttribute('aria-expanded', 'true');
	},
	collapse: function (html) {
		L.DomUtil.removeClass(this.container, 'leaflet-layerpicker-expanded');
		L.DomUtil.addClass(this.container, 'leaflet-layerpicker-collapsed');

        this.closebutton.setAttribute('aria-expanded', 'false');
        this.openbutton.setAttribute('aria-expanded', 'false');
	},
    toggleLayer: function (layerid, show) {
        const reglayer = this.layercheckboxes[layerid];

        if (show) {
            reglayer.checkbox.checked = true;
            this._map.addLayer(reglayer.maplayer);
        }
        else {
            reglayer.checkbox.checked = false;
            this._map.removeLayer(reglayer.maplayer);
        }

		this.options.onLayerChange(layerid, show);
    },
	getLayerStates: function () {
		// return list of status for each layer: label + checked state
		const layerstates = Object.values(this.layercheckboxes).map((layerinfo) => {
			return {
				id: layerinfo.id,
				label: layerinfo.label,
				checked:layerinfo.checkbox.checked,
			};
		});
		return layerstates;
	},
});
