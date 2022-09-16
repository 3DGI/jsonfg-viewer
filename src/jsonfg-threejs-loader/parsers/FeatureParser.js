import {
	BufferGeometry,
	Float32BufferAttribute,
	Mesh,
	MeshLambertMaterial,
	Vector3 } from 'three';
import earcut from 'earcut';
import proj4 from 'proj4';
const defs = require("proj4js-definitions");

export class FeatureParser {

	constructor() {

		this.matrix = null;
		this.crs = "4326"
		proj4.defs("EPSG:7415", 'COMPOUNDCRS["Amersfoort / RD New + NAP height",PROJCRS["Amersfoort / RD New",BASEGEOGCRS["Amersfoort",DATUM["Amersfoort",ELLIPSOID["Bessel 1841",6377397.155,299.1528128,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",7004]],ID["EPSG",6289]],ID["EPSG",4289]],CONVERSION["RD New",METHOD["Oblique Stereographic",ID["EPSG",9809]],PARAMETER["Latitude of natural origin",52.1561605555558,ANGLEUNIT["degree",0.0174532925199433,ID["EPSG",9102]],ID["EPSG",8801]],PARAMETER["Longitude of natural origin",5.38763888888917,ANGLEUNIT["degree",0.0174532925199433,ID["EPSG",9102]],ID["EPSG",8802]],PARAMETER["Scale factor at natural origin",0.9999079,SCALEUNIT["unity",1,ID["EPSG",9201]],ID["EPSG",8805]],PARAMETER["False easting",155000,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",8806]],PARAMETER["False northing",463000,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",8807]],ID["EPSG",19914]],CS[Cartesian,2,ID["EPSG",4499]],AXIS["Easting (X)",east],AXIS["Northing (Y)",north],LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",28992]],VERTCRS["NAP height",VDATUM["Normaal Amsterdams Peil",ID["EPSG",5109]],CS[vertical,1,ID["EPSG",6499]],AXIS["Gravity-related height (H)",up],LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",5709]],ID["EPSG",7415]]');

		this.objectColors = {
			"Building": 0x7497df,
			"BuildingPart": 0x7497df,
			"BuildingInstallation": 0x7497df,
			"Bridge": 0x999999,
			"BridgePart": 0x999999,
			"BridgeInstallation": 0x999999,
			"BridgeConstructionElement": 0x999999,
			"CityObjectGroup": 0xffffb3,
			"CityFurniture": 0xcc0000,
			"GenericCityObject": 0xcc0000,
			"LandUse": 0xffffb3,
			"PlantCover": 0x39ac39,
			"Railway": 0x000000,
			"Road": 0x999999,
			"SolitaryVegetationObject": 0x39ac39,
			"TINRelief": 0xffdb99,
			"TransportSquare": 0x999999,
			"Tunnel": 0x999999,
			"TunnelPart": 0x999999,
			"TunnelInstallation": 0x999999,
			"WaterBody": 0x4da6ff
		};

	}

	parse( data, scene ) {

		if (data.coordRefSys) {
			if (data.coordRefSys.startsWith("https://www.opengis.net/def/crs/EPSG/0/")) {
				this.crs = 'EPSG:' + data.coordRefSys.split("/").at(-1);
			} else {
				console.error("Unsupported coordRefSys string");
			}
		}
		console.log(this.crs)

		// fetch('https://www.opengis.net/def/crs/EPSG/0/'+this.epsg+'/export?format=wkt')
		// .then((response) => console.log(response.json()))
	  // .then((data) => console.log(data));

		for ( const feature of data.features ) {
			
			const geom = this.parseFeature( feature, scene );

		}

	}

	parseFeature( feature, scene ) {


		if ( feature.place ) {
			// console.log("place detected");
			// console.log(feature.place);
			

			const geom = this.parseGeometry( feature.place, this.crs, this.crs );
			// console.log(geom);
			
			const objectType = feature.featureType;

			const material = new MeshLambertMaterial();
			material.color.setHex( this.objectColors[ objectType ] );
			// material.side = DoubleSide;
	
			const mesh = new Mesh( geom, material );
			mesh.name = feature.id;
			mesh.castShadow = true;
			mesh.receiveShadow = true;
	
			scene.add( mesh );
			
		} 

		if ( feature.geometry ) {
			// console.log("geometry detected");
			// console.log(feature.geometry);

			const geom = this.parseGeometry( feature.geometry, "WGS84", this.crs );
			// console.log(geom);

			const objectType = feature.featureType;

			const material = new MeshLambertMaterial();
			material.color.setHex( this.objectColors[ objectType ] );
			// material.side = DoubleSide;
	
			const mesh = new Mesh( geom, material );
			mesh.name = feature.id;
			mesh.castShadow = true;
			mesh.receiveShadow = true;
	
			scene.add( mesh );
			
		} 
		
		
		// else {

		// 	console.log("Feature has no place")
		// 	console.log(feature)
		//   return;

		// }



	}

	parseGeometry( jsonfgGeometry, fromCRS, toCRS ) {

		const geom = new BufferGeometry();
		let positions = [];
		const normals = [];

		//each geometrytype must be handled different
		const geomType = jsonfgGeometry.type;

		// TODO: check all possible geomTypes
		// for now I just looked at: https://github.com/3DGI/cityjson2jsonfg/blob/4f7e537417226aee1f575d7587abbd2ff2339885/cityjson2jsonfg/convert.py#L136



		if ( geomType == "Polyhedron" ) {

			const shells = jsonfgGeometry.coordinates;

			for ( let i = 0; i < shells.length; i ++ ) {

				this.parseShell( geom, shells[ i ], positions, normals );

			}

		} else if ( geomType == "MultiPolygon" || geomType == "CompositeSurface" ) {

			const surfaces = jsonfgGeometry.coordinates;

			this.parseShell( geom, surfaces, positions, normals );

		} else if ( geomType == "MultiSolid" || geomType == "CompositeSolid" ) {

			const solids = jsonfgGeometry.coordinates;

			for ( let i = 0; i < solids.length; i ++ ) {

				for ( let j = 0; j < solids[ i ].length; j ++ ) {

					this.parseShell( geom, solids[ i ][ j ], positions, normals );

				}

			}

		}

		// reproject
		// if ( ! ( fromCRS === toCRS ) ) {
		// 	console.log(fromCRS)
		// 	console.log(toCRS)
		// 	console.log(proj4)
		// 	console.log(positions)
		// 	proj4.defs("EPSG:7415", 'COMPOUNDCRS["Amersfoort / RD New + NAP height",PROJCRS["Amersfoort / RD New",BASEGEOGCRS["Amersfoort",DATUM["Amersfoort",ELLIPSOID["Bessel 1841",6377397.155,299.1528128,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",7004]],ID["EPSG",6289]],ID["EPSG",4289]],CONVERSION["RD New",METHOD["Oblique Stereographic",ID["EPSG",9809]],PARAMETER["Latitude of natural origin",52.1561605555558,ANGLEUNIT["degree",0.0174532925199433,ID["EPSG",9102]],ID["EPSG",8801]],PARAMETER["Longitude of natural origin",5.38763888888917,ANGLEUNIT["degree",0.0174532925199433,ID["EPSG",9102]],ID["EPSG",8802]],PARAMETER["Scale factor at natural origin",0.9999079,SCALEUNIT["unity",1,ID["EPSG",9201]],ID["EPSG",8805]],PARAMETER["False easting",155000,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",8806]],PARAMETER["False northing",463000,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",8807]],ID["EPSG",19914]],CS[Cartesian,2,ID["EPSG",4499]],AXIS["Easting (X)",east],AXIS["Northing (Y)",north],LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",28992]],VERTCRS["NAP height",VDATUM["Normaal Amsterdams Peil",ID["EPSG",5109]],CS[vertical,1,ID["EPSG",6499]],AXIS["Gravity-related height (H)",up],LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",5709]],ID["EPSG",7415]]');
		// 	positions = positions.map( p => proj4(fromCRS, toCRS, p) );
		// 	console.log(positions)
		// }

		// function disposeArray() {

		// 	this.array = null;

		// }

		// geom.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ).onUpload( disposeArray ) );
		geom.setAttribute( 'position', new Float32BufferAttribute( positions.flat(), 3 ) );
		geom.setAttribute( 'normal', new Float32BufferAttribute( normals.flat(), 3 ) );


		if ( this.matrix !== null ) {

			geom.applyMatrix4( this.matrix );

		}

		geom.computeFaceNormals();

		return geom;

	}

	parseShell( geom, boundaries, positions, normals ) {

		// Contains the boundary but with the right verticeId
		for ( let i = 0; i < boundaries.length; i ++ ) {

			let vertices = [];
			let holes = [];

			for ( let j = 0; j < boundaries[ i ].length; j ++ ) {

				if ( vertices.length > 0 ) {

					holes.push( vertices.length );

				}

				// const new_boundary = this.extractLocalIndices( geom, boundaries[ i ][ j ], vertices, json );
				vertices.push( ...boundaries[ i ][ j ] );

			}
			
			
			// get normal of these points
			const normal = this.get_normal_newell( vertices );
			const normal_ = normal.toArray();

			// see if we need to triangulate
			if ( vertices.length == 3 ) {

				positions.push( ...vertices );
				normals.push(normal_, normal_, normal_);

			} else if ( vertices.length > 3 ) {		

				//convert to 2d (for triangulation)
				let pv = [];
				for ( let k = 0; k < vertices.length; k ++ ) {

					const re = this.to_2d( vertices[ k ], normal );
					pv.push( re[0] );
					pv.push( re[1] );

				}

				//triangulate
				const tr = earcut( pv, holes, 2 );

				//create faces based on triangulation
				for ( let k = 0; k < tr.length; k += 3 ) {

					positions.push( vertices[ tr[ k ] ] )
					positions.push( vertices[ tr[ k + 1 ] ] )
					positions.push( vertices[ tr[ k + 2 ] ] )
					normals.push(normal_, normal_, normal_);

				}

			}

		}

	}

	get_normal_newell( points ) {

		// find normal with Newell's method
		let n = [ 0.0, 0.0, 0.0 ];

		for ( let i = 0; i < points.length; i ++ ) {

		  let nex = i + 1;

		  if ( nex == points.length ) {

				nex = 0;

			}

		  n[ 0 ] = n[ 0 ] + ( ( points[ i ][1] - points[ nex ][1] ) * ( points[ i ][2] + points[ nex ][2] ) );
		  n[ 1 ] = n[ 1 ] + ( ( points[ i ][2] - points[ nex ][2] ) * ( points[ i ][0] + points[ nex ][0] ) );
		  n[ 2 ] = n[ 2 ] + ( ( points[ i ][0] - points[ nex ][0] ) * ( points[ i ][1] + points[ nex ][1] ) );

		}

		const b = new Vector3( n[ 0 ], n[ 1 ], n[ 2 ] );
		return ( b.normalize() );

	}

	to_2d( p, n ) {

		p = new Vector3( p[ 0 ], p[ 1 ], p[ 2 ] );
		const x3 = new Vector3( 1.1, 1.1, 1.1 );
		if ( x3.distanceTo( n ) < 0.01 ) {

		  x3.add( new Vector3( 1.0, 2.0, 3.0 ) );

		}

		let tmp = x3.dot( n );
		let tmp2 = n.clone();
		tmp2.multiplyScalar( tmp );
		x3.sub( tmp2 );
		x3.normalize();

		let y3 = n.clone();
		y3.cross( x3 );

		let x = p.dot( x3 );
		let y = p.dot( y3 );

		return [ x, y ];

	}

}
