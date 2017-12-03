'use strict';

const pokeAPI = 'https://pokeapi.co/api/v2/pokemon/';

let map;
let activeInfoWindow = 'none';
let pokeLocations = [
	{ name: 'scyther', notes: 'Hatched from 5km Egg. Evolves into pure badass!', lat: 48.783485, lng: 2.529419 },
	{ name: 'misdreavus', notes: 'Caught in the wild.', lat: 48.777678, lng: 2.531622 },
	{ name: 'pidgey', notes: 'Caught in the wild.', lat: 48.777355, lng: 2.530390 },
	{ name: 'squirtle', notes: 'Caught in the wild. Then it rained for some reason.', lat: 48.796468, lng: 2.561812 },
	{ name: 'magnemite', notes: 'Hatched from 5km Egg. Phone ran out of battery soon after.', lat: 48.797761, lng: 2.560246 },
	{ name: 'chikorita', notes: 'Caught in the wild. Simply adorable.', lat: 48.777299, lng: 2.531951 },
	{ name: 'abra', notes: 'Caught in the wild. Hard catch!', lat: 48.777201, lng: 2.526840 },
	{ name: 'sudowoodo', notes: 'Hatched from 10km Egg.', lat: 48.794309, lng: 2.552482 },
	{ name: 'sneasel', notes: 'Caught in the wild. Clothes were clawed in the process.', lat: 48.778752, lng: 2.527546 },
	{ name: 'ditto', notes: 'Caught in the wild. Disguised as a Sentret!', lat: 48.792252, lng: 2.532884 }
];

function initMap() {
	// PokeAPI Test
	$.getJSON(pokeAPI + 'pikachu').done(function(data) {
		console.log('PokeAPI request successful.');
	}).fail(function() {
		alert('Data from the PokeAPI could not be retrieved at this time. Please try again later!')
	}).always(function() {
		// Always load map, markers and infowindows
		ko.applyBindings(new AppViewModel());
	});
}

function noGMaps() {
	alert('The Google Maps API could not be loaded at this time. Please try again later!');
}

function AppViewModel() {
	let self = this;

	this.markers = ko.observableArray([]);
	this.search = ko.observable("");

	// Create the map
	map = new google.maps.Map(document.getElementById('map'), {
		zoom: 12,
		center: { lat: 48.779601, lng: 2.529526 }
	});

	this.mapStyle = new google.maps.StyledMapType([
		{
			"featureType": "water",
			"elementType": "all",
			"stylers": [
				{
					"hue": "#76aee3"
				},
				{
					"saturation": 38
				},
				{
					"lightness": -11
				},
				{
					"visibility": "on"
				}
			]
		},
		{
			"featureType": "road.highway",
			"elementType": "all",
			"stylers": [
				{
					"hue": "#8dc749"
				},
				{
					"saturation": -47
				},
				{
					"lightness": -17
				},
				{
					"visibility": "on"
				}
			]
		},
		{
			"featureType": "poi.park",
			"elementType": "all",
			"stylers": [
				{
					"hue": "#c6e3a4"
				},
				{
					"saturation": 17
				},
				{
					"lightness": -2
				},
				{
					"visibility": "on"
				}
			]
		},
		{
			"featureType": "road.arterial",
			"elementType": "all",
			"stylers": [
				{
					"hue": "#cccccc"
				},
				{
					"saturation": -100
				},
				{
					"lightness": 13
				},
				{
					"visibility": "on"
				}
			]
		},
		{
			"featureType": "administrative.land_parcel",
			"elementType": "all",
			"stylers": [
				{
					"hue": "#5f5855"
				},
				{
					"saturation": 6
				},
				{
					"lightness": -31
				},
				{
					"visibility": "on"
				}
			]
		},
		{
			"featureType": "road.local",
			"elementType": "all",
			"stylers": [
				{
					"hue": "#ffffff"
				},
				{
					"saturation": -100
				},
				{
					"lightness": 100
				},
				{
					"visibility": "simplified"
				}
			]
		},
		{
			"featureType": "water",
			"elementType": "all",
			"stylers": []
		}
	]);

	this.mapBounds = new google.maps.LatLngBounds();
	map.mapTypes.set('styled_map', self.mapStyle);
	map.setMapTypeId('styled_map');

	// Populate map
	for(let i = 0; i < pokeLocations.length; i++) {
		this.markers.push(new PokeMarker(pokeLocations[i]));
	}

	// Search input
	this.searchResults = ko.computed(function() {
		let filter = self.search().toLowerCase();
		if(!filter) {
			for(let i = 0; i < self.markers().length; i++) {
				self.markers()[i].visible(true);
			}
			return self.markers();
		} else {
			return ko.utils.arrayFilter(self.markers(), function(marker) {
				let result = (marker.name.search(filter) >= 0);
				marker.visible(result);
				return result;
			});
		}
	}, self);

	// Find map bounds
	for(let i = 0; i < this.markers().length; i++) {
		self.mapBounds.extend({ lat: self.markers()[i].lat, lng: self.markers()[i].lng });
	}

	// Show and center all markers
	map.fitBounds(self.mapBounds);

	// Fit map on screen
	let mapHeight = $(document).height() - (56 * 2) + 'px';
	$('#map').css('height', mapHeight);
	$('.list-group').css('max-height', mapHeight);
}

let PokeMarker = function(pokeData) {
	let self = this;

	this.lat = pokeData.lat;
	this.lng = pokeData.lng;
	this.name = pokeData.name;
	this.notes = pokeData.notes;
	this.infoWindow = '';

	this.visible = ko.observable(true);

	this.sprite = '';
	this.types = '';

	$.getJSON(pokeAPI + self.name).done(function(data) {
		//Capitalize pokemon name
		let name = self.name.charAt(0).toUpperCase() + self.name.slice(1);

		// Get pokemon sprite
		self.sprite = data.sprites['front_default'];

		// Get pokemon type(s)
		for(let i = 0; i < data.types.length; i++) {
			// 2+ types? Add comma
			if(self.types !== '')
				self.types += ', ';

			self.types += data.types[i].type['name'];
		}

		self.infoWindow = new google.maps.InfoWindow({
			content: `<h3>${name}</h3>
					<IMG SRC="${self.sprite}" BORDER="0" ALT="Sprite for ${name}">
					<h6>Type(s): ${self.types}</h6>
					<h6>Notes: ${self.notes}</h6>`
		});
	}).fail(function() {
		// PokeAPI did not respond. Show name and notes anyway
		self.infoWindow = new google.maps.InfoWindow({
			content: `<h3>${self.name}</h3>
					<h6>Notes: ${self.notes}</h6>
					<p>Could not load this pokemon's data from PokeAPI. Please reload the page and try again.</p>`
		});
	});

	this.marker = new google.maps.Marker({
		position: { lat: self.lat, lng: self.lng },
		icon: './img/icon_pokeball.png',
		animation: google.maps.Animation.DROP,
		maxWidth: 300,
		map: map
	});

	this.show = ko.computed(function() {
		if(self.visible() === true) {
			self.marker.setMap(map);
		} else {
			self.marker.setMap(null);
		}
		return true;
	}, self);

	this.locate = function() {
		google.maps.event.trigger(self.marker, 'click');
	};

	this.toggleBounce = function() {
		if(self.marker.getAnimation() !== null) {
			self.marker.setAnimation(null);
		} else {
			self.marker.setAnimation(google.maps.Animation.BOUNCE);
		}
	};

	this.marker.addListener('click', function() {
		// Close previously opened infoWindow
		if(activeInfoWindow !== 'none')
			activeInfoWindow.close();

		if(self.infoWindow !== '') {
			self.infoWindow.open(map, this);
			map.panTo({ lat: self.lat, lng: self.lng });

			// Bounce once
			self.toggleBounce();
			setTimeout(function() {
				self.toggleBounce();
			}, 800);

			activeInfoWindow = self.infoWindow;
		} else {
			// PokeAPI request has yet to populate the marker's infoWindow
			alert('Data has yet to be loaded. Please wait and try again.');
		}
	});
};