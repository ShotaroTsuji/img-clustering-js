onmessage = function(e) {
  console.log(e.data);
  var src = e.data.image;

  var N = src.width * src.height;
  var data = new Array(N);

  for( var i = 0 ; i < N ; i++ )
  {
    data[i] = new Uint8ClampedArray(src.data.buffer, i*4, 4);
  }

  var obj = new PAM({data: data, k:e.data.k, distfunc: l1Distance});

  var result = obj.execute(e.data.maxiter);

  postMessage({msg: 'result', data:result});
};

function l1Distance(u, v)
{
  return  Math.abs(u[0]-v[0])
        + Math.abs(u[1]-v[1])
        + Math.abs(u[2]-v[2])
        + Math.abs(u[3]-v[3]);
}

function getRandomInt(min, max)
{
  return Math.floor( Math.random() * (max - min + 1) ) + min;
}

function getPixelVector(data, index)
{
  var vec = new Float32Array(4);

  vec[0] = data[index*4+0];
  vec[1] = data[index*4+1];
  vec[2] = data[index*4+2];
  vec[3] = data[index*4+3] + 0.01;
//  vec[3] = 255;

  return vec;
}

var Cluster = function()
{
  this.medoid = -1;
  this.indices = [];
}

var Cluster = function(medoid)
{
  this.medoid = medoid;
  this.indices = [];
}

Cluster.prototype.addIndex = function(index)
{
  this.indices.push(index);
}

Cluster.prototype.clearIndices = function()
{
  this.indices = [];
}

/* PAM
 * spec = {
 *   data: <Array>,
 *   k: <Integer>,
 *   distfunc: <Function>
 * }
 */
var PAM = function(spec)
{
  this.data = spec.data;
  this.N = spec.data.length;
  this.k = spec.k;
  this.distfunc = spec.distfunc;
}

PAM.prototype.computeClusterCost = function(cluster)
{
  var obj = this;
  return cluster.indices.reduce(function(cost, index)
    {
      return cost + obj.distfunc(obj.data[cluster.medoid], obj.data[index]);
    }, 0);
}

PAM.prototype.execute = function(max_iter)
{
  var clusters = new Array(this.k);

  console.log("PAM: N = ", this.N, "k = ", this.k, ", distfunc = ", this.distfunc);

  PAM.prototype.isSameColor = function(index1, index2)
  {
    var a1 = this.data[index1];
    var a2 = this.data[index2];

    return (a1[0] == a2[0]) && (a1[1] == a2[1]) && (a1[2] == a2[2]);
  }

  for( var j = 0 ; j < this.k ; j++ )
  {
    for( var c = 0 ; c < 100 ; c++ )
    {
      clusters[j] = new Cluster(getRandomInt(0, this.N-1));
//      console.log(j, ": ", getPixelVector(data, clusters[j].medoid));
      var flag = false;
      for( var l = 0 ; l < j ; l++ )
      {
        if( this.isSameColor(clusters[l].medoid, clusters[j].medoid) )
	{
	  flag = true;
	}
      }
      if( !flag ) break;
    }
  }

  for( var iter = 0 ; iter < max_iter ; iter++ )
  {
    console.log("Iteration: ", iter);
    /* cluster assignment */
    for( var j = 0 ; j < this.k ; j++ )
    {
      clusters[j].clearIndices();
    }
    for( var i = 0 ; i < this.N ; i++ )
    {
      var d_min = 2e32-1;
      var cluster_d_min;
      for( var j = 0 ; j < this.k ; j++ )
      {
        var d = this.distfunc(this.data[clusters[j].medoid], this.data[i]);
	if( d < d_min )
	{
	  d_min = d;
	  cluster_d_min = j;
	}
      }

      clusters[cluster_d_min].addIndex(i);
    }

    for( var j = 0 ; j < this.k ; j++ )
    {
      var orig_medoid = clusters[j].medoid;
      var cost0 = this.computeClusterCost(clusters[j]);

//      console.log("Cluster ", j, ": cost = ", cost0);

      for( var c = 0 ; c < 40+2*this.k ; c++ )
      {
        var swap_medoid = getRandomInt(0, clusters[j].indices.length);
        clusters[j].medoid = swap_medoid;
        var cost1 = this.computeClusterCost(clusters[j]);

//      console.log("Swap medoid = ", swap_medoid, ", cost = ", cost1);

        if( cost1 >= cost0 )
        {
          clusters[j].medoid = orig_medoid;
        }
	else
	{
	  break;
	}
      }
    }
    postMessage({msg: 'progress', value: (iter+1)/max_iter*100});
  }

  return clusters;
}

/* function clara
 * data : buffer of ImageData
 * N    : the number of pixels
 * k    : the number of clusters
 * s    : the number of samples
 */
function clara(data, N, k, s, max_trial)
{
  var best_clusters;
  var best_cost = 2e32-1;

  console.log("CLARA: N = ", N, ", k = ", k, ", s = ", s);

  for( var trial = 0 ; trial < max_trial ; trial++ )
  {
    /* sampling */
    var samples = new Uint8ClampedArray(s*4);
    for( var i = 0 ; i < s ; i++ )
    {
      var index = getRandomInt(0, N-1);
      samples[i*4+0] = data[index*4+0];
      samples[i*4+1] = data[index*4+1];
      samples[i*4+2] = data[index*4+2];
      samples[i*4+3] = data[index*4+3];
    }

    /* find medoids with PAM */
    var clusters = pam(samples, s, k, 50);

    /* assign all points */
    var total_cost = 0;
    for( var j = 0 ; j < k ; j++ )
    {
      clusters[j].clearIndices();
    }
    for( var i = 0 ; i < N ; i++ )
    {
      var d_min = 2e32-1;
      var cluster_d_min;
      for( var j = 0 ; j < k ; j++ )
      {
        var d = l1Distance(getPixelVector(data, clusters[j].medoid), getPixelVector(data, i));
	if( d < d_min )
	{
	  d_min = d;
	  cluster_d_min = j;
	}
      }

      total_cost += d_min;

      clusters[cluster_d_min].addIndex(i);
    }

    /* compute cost */
    /*
    var total_cost = 0;
    for( var j = 0 ; j < k ; j++ )
    {
      total_cost += computeClusterCost(clusters[j], data);
    }
    */

    console.log("Trial ", trial, ": cost = ", total_cost);

    if( total_cost < best_cost )
    {
      best_clusters = clusters;
      best_cost = total_cost;
    }
  }

  return best_clusters;
}
