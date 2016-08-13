onmessage = function(e) {
  console.log(e.data);
  segment_image(e.data.algorithm, e.data.originalImage, e.data.resultImage, e.data.numClusters);
};

function segment_image(alg, src, dst, k)
{
  var obj;
  var N = src.width * src.height;
  var data = new Array(N);

  for( var i = 0 ; i < N ; i++ )
  {
    data[i] = new Uint8ClampedArray(src.data.buffer, i*4, 4);
  }

  if( alg == 'kmedoids' )
  {
    importScripts("kmedoids.js");
    obj = new PAM({data: data, k:k, distfunc: l1Distance});
  }
  else if( alg == 'kmeans' )
  {
    importScripts("kmeans.js");
    obj = new Lloyd({data: data, k:k});
  }

  var clusters = obj.execute(10);

  if( alg == 'kmedoids' )
  {
    for( var j = 0 ; j < k ; j++ )
    {
      for( var i = 0 ; i < clusters[j].indices.length ; i++ )
      {
        var medoid = clusters[j].medoid;
        var index = clusters[j].indices[i];

        dst.data[index*4+0] = src.data[medoid*4+0];
        dst.data[index*4+1] = src.data[medoid*4+1];
        dst.data[index*4+2] = src.data[medoid*4+2];
        dst.data[index*4+3] = src.data[medoid*4+3];
      }
    }
  }
  else if( alg == 'kmeans' )
  {
    for( var j = 0 ; j < k ; j++ )
    {
      for( var i = 0 ; i < clusters[j].indices.length ; i++ )
      {
        var centroid = clusters[j].centroid;
        var index = clusters[j].indices[i];

        dst.data[index*4+0] = centroid[0];
        dst.data[index*4+1] = centroid[1];
        dst.data[index*4+2] = centroid[2];
        dst.data[index*4+3] = centroid[3];
      }
    }
  }

  postMessage({msg: 'result', resultImage:dst});
}

function l1Distance(u, v)
{
  return  Math.abs(u[0]-v[0])
	+ Math.abs(u[1]-v[1])
	+ Math.abs(u[2]-v[2])
	+ Math.abs(u[3]-v[3]);
}

function innerProd(u, v)
{
  return u[0]*v[0] + u[1]*v[1] + u[2]*v[2] + u[3]*v[3];
}

function vectorNorm(u)
{
  return Math.sqrt(innerProd(u, u));
}

function projDistance(u, v)
{
/*
  console.log("u = ", u, ", v = ", v);
  console.log("(u, v) = ", innerProd(u, v));
  console.log("|u||v| = ", vectorNorm(u)*vectorNorm(v));
*/
  var prod = innerProd(u, v);
  var scale = vectorNorm(u)*vectorNorm(v);
  var cosT = innerProd(u,v)/(vectorNorm(u)*vectorNorm(v));

  return Math.acos(cosT);
}

var Cluster = function()
{
  this.medoid = -1;
  this.centroid = [];
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

Cluster.prototype.setCentroid = function(centroid)
{
  this.centroid = centroid;
}

Cluster.prototype.clearIndices = function()
{
  this.indices = [];
}
