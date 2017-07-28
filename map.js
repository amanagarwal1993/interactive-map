// Now a separate function to set up the map and its markers
// This function also links the map markers with list items
var mapModel = function() {
  var centroid = vm.centroid();
  
  map = new google.maps.Map(document.getElementById('map'), {
    center: centroid,
    zoom: 12
  });
  
  var map_markers = [];
  
  vm.main_locations().forEach(function(place) {
    var marker = new google.maps.Marker({
      map: map, 
      position: place.coords,
      title: place.name,
      animation: google.maps.Animation.DROP
    });
    
    var info = new google.maps.InfoWindow();
    var info_id = 'marker_' + place.id;
    
    info.setContent('<div id=' + info_id + '><h5>' + place.name + '</h5></div>');
    
    info.addListener('closeclick', function() {
      info.close();
      vm.current_images.removeAll();
      vm.current_place('');
    })
    
    place.info = info;
    marker.type = place.type;
    place.marker = marker;
    marker.addListener('click', function() {
      console.log(third_party_data);
      place.showInfo();
      /*
      info.open(map, marker);  // Get info from third party if not already available
      marker.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(function() {
        marker.setAnimation(null);
      }, 1400);
      */
    });

    map_markers.push(marker);
  });
};


// Hides markers which are not in current filtered list.
function hideMarker(text) {
  vm.main_locations().forEach(function(place) {
    if (place.showIt() == false) {
      place.marker.setVisible(false);
    }
    else {
      place.marker.setVisible(true);
    }
  })
}

// Function runs when the Google maps API fails to load properly.
function loadError() {
  alert('Oh no. Google maps failed to load!');
}