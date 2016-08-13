function getRandomInt(min, max)
{
  return Math.floor( Math.random() * (max - min + 1) ) + min;
}

function getPixelVector(img, index)
{
  var vec = new Float32Array(4);

  vec[0] = img.data[index*4+0];
  vec[1] = img.data[index*4+1];
  vec[2] = img.data[index*4+2];
  vec[3] = img.data[index*4+3];

  return vec;
}

function addVector(u, v)
{
  var r = new Float32Array(4);

  r[0] = u[0] + v[0];
  r[1] = u[1] + v[1];
  r[2] = u[2] + v[2];
  r[3] = u[3] + v[3];

  return r;
}

function scaleVector(c, v)
{
  var u = new Float32Array(4);

  u[0] = c*v[0];
  u[1] = c*v[1];
  u[2] = c*v[2];
  u[3] = c*v[3];

  return u;
}

function euclideanSquaredDistance(u, v)
{
  return (u[0]-v[0])*(u[0]-v[0])
       + (u[1]-v[1])*(u[1]-v[1])
       + (u[2]-v[2])*(u[2]-v[2])
       + (u[3]-v[3])*(u[3]-v[3]);
}

function euclideanDistance(u, v)
{
  return Math.sqrt(
  		  Math.pow(u[0]-v[0], 2)
		+ Math.pow(u[1]-v[1], 2)
		+ Math.pow(u[2]-v[2], 2)
		+ Math.pow(u[3]-v[3], 2));
}

/* Lloyd
 * spec = {
 *   data: <Array>,
 *   k: <Integer>,
 * }
 */
var Lloyd = function(spec)
{
  this.points = spec.data;
  this.N = spec.data.length;
  this.k = spec.k;
}

Lloyd.prototype.execute = function execute(max_iter)
{
  var centroids = new Array(this.k); /* represented by vector */
  var assignments = new Array(this.N); /* represented by cluster index */

  /* Initial centroids */
  for( var j = 0 ; j < this.k ; j++ )
  {
    centroids[j] = this.points[getRandomInt(0, this.N-1)];
  }

//  console.log(centroids[0], centroids[1]);

  for( var iter = 0 ; iter < 50 ; iter++ )
  {
    /* assignment */
    var num_changed = 0;
    for( var i = 0 ; i < this.N ; i++ )
    {
      var min_dist = 100000000;
      var min_index = 0;
      for( var j = 0 ; j < this.k ; j++ )
      {
        var d = euclideanSquaredDistance(this.points[i], centroids[j]);
        if( d < min_dist )
        {
          min_dist = d;
	  min_index = j;
        }
      }
      if( assignments[i] != min_index ) num_changed++;
      assignments[i] = min_index;
    }
//    console.log("Num changed", num_changed);
    postMessage({msg: 'progress', value: 100-num_changed/this.N*100});

    if( num_changed == 0 ) break;

    /* cluster update */
    var sums = new Array(this.k);
    var num_elements = new Array(this.k);
    for( var j = 0 ; j < this.k ; j++ )
    {
      sums[j] = new Float32Array(4);
      num_elements[j] = 0;
    }
    for( var i = 0 ; i < this.N ; i++ )
    {
      var j = assignments[i];
      sums[j] = addVector(this.points[i], sums[j]);
      num_elements[j]++;
    }
    for( var j = 0 ; j < this.k ; j++ )
    {
      centroids[j] = scaleVector(1.0/num_elements[j], sums[j]);
    }

  }

  /* floor centroids */
  for( var j = 0 ; j < this.k ; j++ )
  {
    centroids[j][0] = Math.floor(centroids[j][0]);
    centroids[j][1] = Math.floor(centroids[j][1]);
    centroids[j][2] = Math.floor(centroids[j][2]);
    centroids[j][3] = Math.floor(centroids[j][3]);
  }

  var clusters = new Array(this.k);
  for( var j = 0 ; j < this.k ; j++ )
  {
    clusters[j] = new Cluster;
    clusters[j].setCentroid(centroids[j]);
  }
  for( var i = 0 ; i < this.N ; i++ )
  {
    clusters[assignments[i]].addIndex(i);
  }

  return clusters;
}
