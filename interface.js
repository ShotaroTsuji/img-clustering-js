var imageLoader;

var imagecanvas;
var resultcanvas;

const max_height = 240;
const max_width = 320;

var filterInput;
var filterForm;
var filterSize;

var checkNormal;
var checkSIMD;

var formWorker;
var formParameters = {};

function init()
{
  imageLoader = document.getElementById('imageLoader');
  imageLoader.addEventListener('change', handleImage, false);
  imagecanvas = document.getElementById('imageCanvas');
  resultcanvas = document.getElementById('resultCanvas');
  filterSize = 3;
  filterForm = document.getElementById('filterForm');
  createKmeansForm(filterForm);
}

function createKmeansForm(elem)
{
  var input = document.createElement('input');
  input.setAttribute('type', 'number');
  input.setAttribute('min', '2');
  input.setAttribute('value', '2');
  elem.appendChild(input);
  formParameters = {k: input.value};

  input.onchange = function() {
    formParameters.k = input.value;
  }
}

function handleImage(e){
    var reader = new FileReader();
    reader.onload = function(ev){
        var img = new Image();
        img.onload = function(){
	    /* copy image data to canvas object */
	    imagecanvas.width = img.naturalWidth;
	    imagecanvas.height = img.naturalHeight;
	    imagecanvas.getContext('2d').drawImage(img, 0, 0);

	    document.getElementById('imageSize').innerHTML="<p>width: "+img.naturalWidth+", height: "+img.naturalHeight+"</p>";
        }
        img.src = ev.target.result;
	setImageElementToBox('sourceImage', img);
    }
    reader.readAsDataURL(e.target.files[0]);     
}

function setImageElementToBox(boxid, image)
{
  var box = document.getElementById(boxid);

  while( box.firstChild )
  {
    box.removeChild(box.firstChild);
  }

  image.setAttribute('style', 'width: 100%; height: auto;');

  box.appendChild(image);
}

function applyFilter()
{
  var origImageData;
  var resultImageData;

  document.getElementById('elapsedTime').innerHTML="<p>Processing...</p>";

  origImageData = imagecanvas.getContext('2d').getImageData(0, 0, imagecanvas.width, imagecanvas.height);
  resultImageData = imagecanvas.getContext('2d').createImageData(imagecanvas.width, imagecanvas.height);

/*
  filterInput.value = Math.floor(filterInput.value);
  if( filterInput.value < 2 ) filterInput.value = 2;
*/

  var kmeansWorker = new Worker('kmedoids.js');

  var date1;
  var date2;

  date1 = new Date();

//  kmeans(origImageData, resultImageData, filterInput.value);
//  kmeansWorker.postMessage([origImageData, resultImageData, formParameters.k]);
  kmeansWorker.postMessage(
    {algorithm: 'kmedoids',
     originalImage: origImageData,
     resultImage: resultImageData,
     numClusters: formParameters.k}
  );

  kmeansWorker.onmessage = function(e)
  {
    date2 = new Date();

    console.log(e);

    if( e.data.msg == 'result' )
    {
      resultImageData = e.data.resultImage;

      console.log(resultImageData.width, resultImageData.height, resultImageData.data.length);

      resultcanvas.width = resultImageData.width;
      resultcanvas.height = resultImageData.height;
      resultcanvas.getContext('2d').putImageData(resultImageData, 0, 0);

      var image = new Image;
      image.src = resultcanvas.toDataURL();
      setImageElementToBox('resultImage', image);

//      copyToDrawCanvas(resultcanvas, drawcanvas2);

      document.getElementById('elapsedTime').innerHTML="<p>"+(date2-date1)+"ms</p>";
    }
    else if( e.data.msg == 'progress' )
    {
      document.getElementById('elapsedTime').innerHTML="<p>"+e.data.value+"% done</p>";
    }
  };
}
