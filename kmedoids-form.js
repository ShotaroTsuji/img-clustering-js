var params = {};

function sendParameters()
{
  postMessage({msg: 'parameters', parameters: params});
}

onmessage = function(e)
{
  if( e.msg == 'init' )
  {
    var elem = document.getElementById('filterForm');
    var input = document.createElement('input');
    input.setAttribute('type', 'number');
    input.setAttribute('min', '2');
    input.setAttribute('value', '2');
    elem.appendChild(input);

    input.onchange = function() {
      params.k = input.value;
      sendParameters();
    }
  }
}
