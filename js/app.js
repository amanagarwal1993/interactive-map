var map;
var third_party_data = {};

// Creating hardcoded data for list locations
var Model = [
  {
    name: 'Eiffel Tower',
    type: 'monument',
    city: 'Paris',
    coords: {lat: 48.8584, lng: 2.2945}
  },
  {
    name: 'Le Louvre',
    type: 'museum',
    city: 'Paris',
    coords: {lat: 48.8606, lng: 2.3376}
  },
  {
    name: 'Arc de Triomphe',
    type: 'monument',
    city: 'Paris',
    coords: {lat: 48.8738, lng: 2.2950}
  },
  {
    name: 'Sacre Coeur',
    type: 'church',
    city: 'Paris',
    coords: {lat: 48.8867, lng: 2.3431}
  },
  {
    name: 'Les Catacombes de Paris',
    type: 'ossuary/cemetry',
    city: 'Paris',
    coords: {lat: 48.8338, lng: 2.3324}
  }
];


// CREATING THE VIEWMODEL
var ViewModel = function() {
  
  var self = this;
  self.main_locations = ko.observableArray();
  self.filter_query = ko.observable("");
  self.current_images = ko.observableArray();
  self.current_place = ko.observable();
  
  // Getting the viewport width helps in downloading the right size of image files, for efficiency
  this.viewwidth = ko.computed(function() {
    return $('body').width();
  });
  
  /**
  * @description Class for creating a new location/list item
  * @constructor
  */
  var Place = function(data) {
    this.name = data.name;
    this.city = data.city;
    this.coords = data.coords;
    this.type = data.type;
    this.marker = {};
    this.id = "";
    this.info = {};
    
    // Filter functionality
    this.showIt = ko.computed(function() {
      if (self.filter_query() === "") {
        return true;
      }
      var query = new RegExp(self.filter_query(), 'i');
      if (query.test(this.name)) {
        return true;
      }
      else {
        return false
      };
    }, this);
    
    /**
    * @description When a place or its map marker is clicked, it makes ajax calls to Foursquare API and opens a div showing pictures
    */
    this.showInfo = function() {
      self.current_images.removeAll();
      this.marker.setAnimation(google.maps.Animation.BOUNCE);
      var place = this;
      
      var info_url = 'https://api.foursquare.com/v2/venues/search?ll=' 
                      + (place.coords.lat).toString() + ',' 
                      + (place.coords.lng).toString() + '&limit=3&radius=50&' 
                      + 'client_id=TBCZE2GVGWDVSOGOI1HWF4FNX5SLQ34TRRGFX1KK0AWYLOG4&' 
                      + 'client_secret=WAMCH3JMSEHEAU0NZRXUMDO331QCUAPE1XDAG2ZNL0BACCO4&' 
                      + 'v=20170610&m=foursquare';
      
      var venues = [];
      var pictures = new Array;
      var pictures_length = 0;
      
      place.info.open(map, place.marker);
      setTimeout(function() {
        place.marker.setAnimation(null);
      }, 900);
      
      $.get(info_url).then(function (data) {
        // Getting venues
        venues = data.response.venues;
        self.current_place(venues[0].name);
      }, function() {
        alert('It seems Foursquare API is not working for you.');
      }).then(function() {
        // Getting images
        if ((third_party_data[place.id]).length < 1) {
          var requests = [];
          // Get 2 picture urls for each ID
          for(var i=0; i<venues.length; i++) { 
            var venue = venues[i];
            var new_url = 'https://api.foursquare.com/v2/venues/' + venue.id + '/photos?limit=3&' + 'client_id=TBCZE2GVGWDVSOGOI1HWF4FNX5SLQ34TRRGFX1KK0AWYLOG4&' + 'client_secret=WAMCH3JMSEHEAU0NZRXUMDO331QCUAPE1XDAG2ZNL0BACCO4&v=20170610';
            
            // I create a promise for each ajax request and add them to an array
            // These requests will all be executed at once. Oh Promises, I love you
            requests.push(new Promise((resolve, reject) => {
              $.ajax({url: new_url}).done(function(data) {
                var pics = data.response.photos.items;
                resolve(pics);
              }).fail(function() {
                reject('Fetching images failed');
              });
            }));
          }; // Loop ends
          
          // Execute the promises at once
          Promise.all(requests).then(function(results) {
            results.forEach(function(pics) {
              pictures.push(pics[0]);
              pictures.push(pics[1]);
              pictures.push(pics[2]);
            });
            var urls = [];
            third_party_data[place.id] = pictures;
            var width = Math.round($('html').width());
            console.log(width);
            if (width < 418) {
              var size = width;  
            }
            else if (width < 800) {
              var size = Math.round(width / 2);
            }
            else {
              var size = Math.round(width / 4);
            }
          
            size = size.toString();
            size = size + 'x' + size;
            for (var i=0; i<pictures.length; i++) {
              var img = pictures[i].prefix + size + pictures[i].suffix;
              urls.push(img);
            }
            for(var i=0; i<urls.length; i++) {
              self.current_images.push(urls[i]);
            };
            
          }, function() {
            alert('Foursquare images failed to load! Try again.');
          })
          // if block ends
        } else {
            // No need to fetch new image urls, they have already been downloaded previously
            console.log('already exists');
            var urls = [];
            var width = Math.round($('html').width());
            console.log(width);
            if (width < 418) {
              var size = width;  
            }
            else if (width < 800) {
              var size = Math.round(width / 3);
            }
            else {
              var size = Math.round(width / 4);
            }
          
            size = size.toString();
            size = size + 'x' + size;
            for (var i=0; i<third_party_data[place.id].length; i++) {
              var img = third_party_data[place.id][i].prefix + size + third_party_data[place.id][i].suffix;
              urls.push(img);
            }
            for(var i=0; i<urls.length; i++) {
              self.current_images.push(urls[i]);
            };
        }}, function() {
        console.log('Something went wrong while fetching images');
      });
      
    } // function showIt ends
  }; // class constructor Place ends
  
  // Upon app launch, fill the main_locations array
  for(var i=0; i<Model.length; i++) {
    var place = new Place(Model[i]);
    self.main_locations.push(place);
    place.id = 'place' + i.toString();
    third_party_data[place.id] = [];
  };
  
  // Setting a centroid for the map's center
  self.centroid = ko.computed(function() {
    var longitude = 0;
    var latitude = 0;
    var count = 0;
    self.main_locations().forEach(function(place) {
      if (place.showIt) {
        longitude += place.coords.lng;
        latitude += place.coords.lat;
        count += 1;
      }
    });
    longitude = longitude / count;
    latitude = latitude / count;
    return {lat: latitude, lng: longitude};
  });
  
};

var vm = new ViewModel();
ko.applyBindings(vm);

// Map and markers will be dealt with in the file "map.js"