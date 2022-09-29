<template>
  <div class="h-100">
    <div
      id="helpModal"
      class="modal fade"
      tabindex="-1"
      role="dialog"
      aria-labelledby="helpModelLabel"
      aria-hidden="true"
    >
      <div
        class="modal-dialog"
        role="document"
      >
        <div class="modal-content">
          <div class="modal-header bg-info text-white">
            <h5
              id="helpModelLabel"
              class="modal-title"
            >
              <i class="far fa-question-circle mr-1"></i> Help
            </h5>
            <button
              type="button"
              class="close"
              data-dismiss="modal"
              aria-label="Close"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <p>This is the JSON-FG viewer.</p>
            <p>The source code is available in <a href="https://github.com/3DGI/jsonfg-viewer">GitHub</a>. Have fun and, please, report any issues found <a href="https://github.com/3DGI/jsonfg-viewer/issues">here</a>.</p>
            <p>Here is what you can do:</p>
            <ul>
              <li>Click on an object ID in the tree view on the left to select it.</li>
              <li>Click or tap on an object in the 3D view to select it.</li>
              <li>When an object is selected you see a card with it's information (oh, wow)! If you click on a surface with semantics, its information will also be accessible.</li>
              <li>Toggle between different LoDs by clicking on the corresponding buttons on the bottom left corner of the viewer.</li>
              <li>Toggle the editing mode with the <i class="fas fa-pen mx-1 text-muted"></i> icon to edit it. Then save the changes.</li>
              <li>Download the city model with your changes by clicking on <b>Download</b>.</li>
            </ul>
            <p>This JSON-FG viewer is an adaptation of the excellent <a href="https://viewer.cityjson.org">CityJSON viewer</a>, which you can use for visualising CityJSON files.</p>
          </div>
        </div>
      </div>
    </div>
    <div
      id="configModal"
      class="modal fade"
      tabindex="-1"
      role="dialog"
      aria-labelledby="helpModelLabel"
      aria-hidden="true"
    >
      <div
        class="modal-dialog"
        role="document"
      >
        <div class="modal-content">
          <div class="modal-header text-info">
            <h5
              id="helpModelLabel"
              class="modal-title"
            >
              <i class="fas fa-sliders-h mr-1"></i> Settings
            </h5>
            <button
              type="button"
              class="close"
              data-dismiss="modal"
              aria-label="Close"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group row custom-control custom-switch ml-1">
              <input
                id="cameraLightSwitch"
                v-model="cameraLight"
                type="checkbox"
                class="custom-control-input"
              >
              <label
                class="custom-control-label"
                for="cameraLightSwitch"
              >Camera light</label>
            </div>
            <ColorEditor
              v-model="background_color"
              name="Background"
            ></ColorEditor>
            <ColorEditor
              v-model="selectionColor"
              name="Selection"
            ></ColorEditor>
            <div
              id="accordionExample"
              class="accordion"
            >
              <div class="card">
                <div
                  id="headingOne"
                  class="card-header"
                >
                  <h2 class="mb-0">
                    <button
                      class="btn btn-link btn-block text-left collapsed"
                      type="button"
                      data-toggle="collapse"
                      data-target="#collapseOne"
                      aria-expanded="true"
                      aria-controls="collapseOne"
                    >
                      Object Colours
                    </button>
                  </h2>
                </div>

                <div
                  id="collapseOne"
                  class="collapse"
                  aria-labelledby="headingOne"
                  data-parent="#accordionExample"
                >
                  <div class="card-body">
                    <ColorEditor
                      v-for="(color, type) in object_colors"
                      :key="type"
                      v-model="object_colors[type]"
                      :name="type"
                    ></ColorEditor>
                  </div>
                </div>
              </div>
              <div class="card">
                <div
                  id="headingTwo"
                  class="card-header"
                >
                  <h2 class="mb-0">
                    <button
                      class="btn btn-link btn-block text-left collapsed"
                      type="button"
                      data-toggle="collapse"
                      data-target="#collapseTwo"
                      aria-expanded="false"
                      aria-controls="collapseTwo"
                    >
                      Surface Colours
                    </button>
                  </h2>
                </div>
                <div
                  id="collapseTwo"
                  class="collapse"
                  aria-labelledby="headingTwo"
                  data-parent="#accordionExample"
                >
                  <div class="card-body">
                    <ColorEditor
                      v-for="(color, type) in surface_colors"
                      :key="type"
                      v-model="surface_colors[type]"
                      :name="type"
                    ></ColorEditor>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <nav
      class="navbar navbar-dark"
      :class="[ data_loaded ? 'bg-dark' : 'bg-white' ]"
    >
      <div class="d-flex justify-content-end align-items-center col-auto p-0">
        <div
          v-show="loading"
          class="spinner-border text-warning mr-2"
          role="status"
        >
          <span class="sr-only">Loading...</span>
        </div>
        <button
          type="button"
          class="btn btn-outline-info mr-1"
          data-toggle="modal"
          data-target="#configModal"
        >
          <i class="fas fa-sliders-h mr-1"></i> Settings
        </button>
        <button
          type="button"
          class="btn"
          :class="[ data_loaded ? 'btn-outline-light' : 'btn-outline-dark' ]"
          data-toggle="modal"
          data-target="#helpModal"
        >
          <i class="far fa-question-circle mr-1"></i> Help
        </button>
      </div>
    </nav>
    <div
      v-if="data_loaded"
      id="main_content"
    >
      <div class="container-fluid h-100">
        <div class="row h-100">
          <div class="col-4 p-0 h-100">
            <div
              v-show="active_sidebar == 'objects'"
              class="h-100"
            >
              <div class="h-100 d-flex flex-column">
                <div class="p-3 shadow-sm">
                  <h5>
                    Feature Collection
                    <span class="badge badge-secondary">
                      {{ Object.keys(activeFeatureCollection.features).length }} total
                    </span>
                  </h5>
                  <h6>
                    <span class="badge-pill badge-light">
                      coordRefSys : {{ featuregeoms.coordRefSys }}
                    </span>
                  </h6>
                  <input
                    v-model="search_term"
                    type="search"
                    class="form-control col mb-2 shadow-sm"
                    placeholder="Search for IDs, object type or attributes..."
                  >
                  <label for="inputGroupPaginateLimit">Paginate</label>
                  <div
                    v-show="data_loaded"
                    class="d-flex justify-content-start col-auto p-0"
                  >
                    <div class="input-group">
                      <input type="text" class="form-control"
                             id="inputGroupPaginateLimit"
                             ref="paginateLimit"
                             placeholder="Limit"
                             aria-label="Paginate with limit"
                             aria-describedby="button-addon4"
                             @input="setPaginateLimit()"
                      >
                      <div class="input-group-append" id="button-addon4">
                        <button
                          class="btn btn-outline-secondary"
                          type="button"
                          @click="paginatePrev"
                        >Prev
                        </button>
                        <button
                          class="btn btn-outline-secondary"
                          type="button"
                          @click="paginateNext"
                        >Next
                        </button>
                      </div>
                    </div>
                  </div>
                  <div
                    v-show="data_loaded"
                    class="d-flex justify-content-end col-auto p-0"
                  >
                    <button
                      class="btn btn-primary col-auto"
                      @click="downloadModel()"
                    >
                      <i class="fas fa-download mr-1"></i> Download
                    </button>
                    <button
                      class="btn btn-danger col-auto ml-2"
                      @click="reset()"
                    >
                      <i class="fas fa-times mr-1"></i> Close
                    </button>
                  </div>
                </div>
                <FeatureCollectionTree
                        :featurecollection="activeFeatureCollection.features"
                        :selected_fid="selected_fid"
                        :featuregeoms="activeFeatureCollection"
                        :matches="matches"
                        @object_clicked="move_to_object($event)"
                ></FeatureCollectionTree>
              </div>
            </div>
          </div>
          <div class="col-7 p-0 h-100">
            <div
              class="col-auto m-2"
              style="position: absolute; z-index: 1"
            >
              <FeatureCard
                v-if="existsSelected"
                :featuregeoms="activeFeatureCollection"
                :feature_id="selected_fid"
                :expanded="0"
                @close="selected_fid = null">
              </FeatureCard>
            </div>
            <ThreeJsViewer
              ref="viewer"
              :featureCollection="activeFeatureCollection"
              :selectedObjid="selected_fid"
              :selectedObjidx="selected_fidx"
              :selected-boundary-idx="selectedBoundaryId"
              :object-colors="object_colors"
              :surface-colors="surface_colors"
              :background-color="background_color"
              :selection-color="selectionColor"
              :show-semantics="showSemantics"
              :camera-spotlight="cameraLight"
              :activeLod="toggleGeometryPlace"
              :highlight-selected-surface="highlightSurface"
              @object_clicked="move_to_object($event)"
              @rendering="loading = $event"
            ></ThreeJsViewer>
            <div
              style="position: absolute; z-index: 1; bottom: 0px; left: 0px"
            >
              <div
                class="btn-group ml-1 mb-1 bg-white"
                role="group"
                aria-label="Geometry toggle"
              >
                <button
                  type="button"
                  :class="['btn', toggleGeometryPlace === -1 ? 'btn-primary' : 'btn-outline-primary']"
                  @click="toggleGeometryPlace = -1"
                >
                  All
                </button>
                <button
                  type="button"
                  :class="['btn', toggleGeometryPlace === 0 ? 'btn-primary' : 'btn-outline-primary']"
                  @click="toggleGeometryPlace = 0"
                >
                  Only geometry
                </button>
                <button
                  type="button"
                  :class="['btn', toggleGeometryPlace === 1 ? 'btn-primary' : 'btn-outline-primary']"
                  @click="toggleGeometryPlace = 1"
                >
                  Only place
                </button>
              </div>
            </div>
            <div
              class="card"
              style="position: absolute; z-index: 1; bottom: 0px; right: 0px"
            >
              <div class="m-1 px-2">
                <a
                  class="card-link"
                  href="https://github.com/3DGI/jsonfg-viewer"
                  target="_blank"
                ><i class="fab fa-github"></i> jsonfg-viewer v0.1.0</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else>
      <div
        class="container"
        style="width:75%; max-width: 680px"
      >
        <div class="row">
          <main class="col-12 py-md-3 pl-md-5">
            <h2>File upload</h2>
            <p>Upload a JSON-FG file:</p>
            <div class="input-group mb-3">
              <div class="input-group-prepend">
                <span class="input-group-text"><i class="fas fa-upload mr-1"></i> Upload</span>
              </div>
              <div class="custom-file">
                <input
                  id="inputGroupFile01"
                  ref="jsonFGFile"
                  type="file"
                  class="custom-file-input"
                  @change="selectedFile"
                >
                <label
                  class="custom-file-label"
                  for="inputGroupFile01"
                >Choose file or drop it here...</label>
              </div>
            </div>
            <h2>Connect to an API</h2>
            <p>OGC Features API serving JSON-FG data:</p>
            <div class="input-group mb-3">
              <div class="custom-file">
                <input
                  id="inputGroupUrl01"
                  placeholder="Paste the API URL here..."
                  ref="apiUrl"
                  type="url"
                  class="form-control"
                >
              </div>
              <div class="input-group-append">
                <button
                  class="btn btn-outline-secondary"
                  type="button"
                  id="button-addon2"
                  @click="setApiUrl"
                >Load</button>
              </div>
            </div>
            <div
              v-show="error_message"
              class="alert alert-danger"
              role="alert"
            >
              {{ error_message }}
              <button
                type="button"
                class="close"
                data-dismiss="alert"
                aria-label="Close"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <h3 v-if="api_url">Collections</h3>
            <div
              v-if="api_url">
              <p v-for="collection in this.api_collections"
              ><a href="#" @click="requestFromUrl(getApiCollectionItemsUrl(collection))">{{ collection.title }}</a></p>
            </div>
          </main>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ColorEditor from './components/ColorEditor.vue';
import NinjaSidebar from './components/NinjaSidebar.vue';
import ThreeJsViewer from './components/ThreeJsViewer.vue';
import $ from 'jquery';
import _ from 'lodash';
import FeatureCollectionTree from "./components/FeatureCollectionTree";
import FeatureCard from "./components/FeatureCard";
import axios from 'axios';

export default {
	name: 'App',
	components: {
    FeatureCollectionTree,
    FeatureCard,
		ColorEditor,
		NinjaSidebar,
    ThreeJsViewer
	},
	data: function () {

		return {
			data_loaded: false,
			search_term: "",
			featuregeoms: {},
			selected_fid: null,
			selected_fidx: null,
      paginate_limit: null,
      api_url: null,
      api_collections: null,
			// selectedGeometryId: - 1,
			selectedBoundaryId: - 1,
			loading: false,
			error_message: null,
			active_sidebar: 'objects', // objects/versions
			object_colors: {
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
			},
			surface_colors: {
				"GroundSurface": 0x999999,
				"WallSurface": 0xffffff,
				"RoofSurface": 0xff0000,
				"TrafficArea": 0x6e6e6e,
				"AuxiliaryTrafficArea": 0x2c8200,
				"Window": 0x0059ff,
				"Door": 0x640000
			},
			background_color: 0xd9eefc,
			selectionColor: 0xffc107,
			showSemantics: false,
			highlightSurface: false,
			toggleGeometryPlace: -1, // -1: both, 0: geometry, 1: place
			cameraLight: true
		};

	},
  computed: {
		activeFeatureCollection: function () {

      return this.featuregeoms;

		},
		logoUrl: function () {

			if ( this.data_loaded ) {

				return "logoWhite.svg";

			}

			return "logoBlack.svg";

		},
		firstLevelObjects: function () {

			return _.pickBy( this.activeFeatureCollection.CityObjects, function (cityobject ) {

				return ! ( cityobject.parents && cityobject.parents.length > 0 );

			} );

		},
		filteredCityObjects: function () {

			var result = _.pickBy( this.activeFeatureCollection.CityObjects, function (value, key ) {

				var regex = RegExp( this.search_term, "i" );
				var obj_json = JSON.stringify( value );
				return regex.test( key ) | regex.test( obj_json );

			} );

			return result;

		},
		existsSelected: function () {

			return this.selected_fid != null;

		}
	},
	watch: {
    api_url: function() {
      axios
        .get(this.api_url + "/collections")
        .then(response => {
            this.api_collections = response.data.collections;
        })
        .catch(error => {
          console.log(error);
          this.errored = true;
        })
        .finally(() => {
          this.loading = false;
        })
    },
		selected_fid: function () {

			if ( this.selected_fid != null ) {

				var card_id = $.escapeSelector( this.selected_fid );
				$( `#${card_id}` )[ 0 ].scrollIntoViewIfNeeded();

			}

		}
	},
	methods: {
		move_to_object( ids ) {

			if ( ids ) {
				// `ids` is in the form of { feature_id: ..., feature_idx: ..., boundary_id: ... }
				this.selected_fid = ids.feature_id;
				this.selected_fidx = ids.feature_idx;
				// this.selectedGeometryId = ids;
				this.selectedBoundaryId = ids.boundary_id;

			} else {

				this.selected_fid = null;
				this.selected_fidx = null;
				// this.selectedGeometryId = - 1;
				// this.selectedBoundaryId = - 1;

			}

		},
		reset() {

			this.featuregeoms = {};
			this.search_term = "";
      this.selected_fid = null;
      this.selected_fidx = null;
			this.data_loaded = false;
      this.api_url = null;

		},
		matches( feature ) {

			var regex = RegExp( this.search_term, "i" );
			var f_json = JSON.stringify( feature );
      return regex.test(f_json);

		},
		selectedFile() {

			this.loading = true;

			let file = this.$refs.jsonFGFile.files[ 0 ];
			if ( ! file || file.type != "application/json" ) {

				this.error_message = "This is not a JSON file!";
				this.loading = false;
				return;

			}

			let reader = new FileReader();
			reader.readAsText( file, "UTF-8" );
			reader.onload = evt => {

				const fg = JSON.parse( evt.target.result );

				if ( this.validateJsonFgFile( fg ) === false ) {

					this.loading = false;
					return;

				}

				this.featuregeoms = fg;

				this.data_loaded = true;

				this.loading = false;

			};

		},
    setApiUrl() {
      if (this.$refs.apiUrl.value === null || this.$refs.apiUrl.value === "") {
          this.error_message = "Please enter a valid URL";
          this.loading = false;
          return;
      }
      const _u = this.$refs.apiUrl.value.trim();
      const coll_idx = _u.search("/collections");
      if (coll_idx < 0) {
          if (_u.slice(-1) === "/") {
              this.api_url = _u.substring(0, _u.length - 1);
          } else {
              this.api_url = _u;
          }
      } else {
          this.api_url = _u.substring(0, coll_idx);
      }
    },
    getApiCollectionItemsUrl(collection) {
      const c = collection.links.filter((link) => link.rel === 'items' && (link.type === 'application/vnd.ogc.fg+json' || link.type === 'application/fg+json'))
      if (c.length === 0) {
        this.error_message = "Collection is not available in JSON-FG"
      }
      return c[0].href;
    },
    requestFromUrl(url) {
      this.loading = true;
      // "https://d123.ldproxy.net/montreal/collections/buildings/items?f=jsonfg&crs=http://www.opengis.net/def/crs/EPSG/0/6661"
      axios
        .get(url)
        .then(response => {
          if (this.validateJsonFgApi(response.headers) === false) {
              this.loading = false;
              return;
          }
          this.featuregeoms = response.data;
        })
        .catch(error => {
          console.log(error);
          this.errored = true;
        })
        .finally(() => {
          this.data_loaded = true;
          this.loading = false;
        })
    },
		validateJsonFgFile(fg) {

      //TODO: not sure how else can we validate that it is a json-fg file?
			if ( fg.type != "FeatureCollection" ) {

				this.error_message = "This file is not a FeatureCollection!";

				return false;

			}

			return true;

		},
    validateJsonFgApi(headers){
      if (headers["content-type"] !== "application/vnd.ogc.fg+json" && headers["content-type"] !== "application/fg+json") {
        this.error_message = "This API does not provide JSON-FG data!";
        return false;
      }
      return true;
    },
		download( filename, text ) {

			var element = document.createElement( 'a' );
			element.setAttribute( 'href', 'data:application/json;charset=utf-8,' + encodeURIComponent( text ) );
			element.setAttribute( 'download', filename );

			element.style.display = 'none';
			document.body.appendChild( element );

			element.click();

			document.body.removeChild( element );

		},
		downloadModel() {

			var text = JSON.stringify( this.featuregeoms );

			this.download( "file.fg.json", text );

		},
    paginatePrev() {
      const limit = this.paginate_limit;
      const link = this.featuregeoms.links.filter((link) => link.rel === "prev");
      if (link.length !== 0) {
        this.reset();
        this.requestFromUrl(this.paginatedUrl(link[0].href, limit));
      }
    },
    paginateNext() {
      const limit = this.paginate_limit;
      const link = this.featuregeoms.links.filter((link) => link.rel === "next");
      if (link.length !== 0) {
        this.reset();
        this.requestFromUrl(this.paginatedUrl(link[0].href, limit));
      }
    },
    paginatedUrl(url, limit) {
      const base = url.split("?")[0];
      const params = new URLSearchParams(url.split("?")[1]);
      if (limit === null || limit === "") {
        if (params.has("limit")) params.delete("limit");
      } else {
        params.set("limit", limit);
      }
      return base + "?" + params.toString();
    },
    setPaginateLimit() {
      this.paginate_limit = this.$refs.paginateLimit.value;
    }
	}
};
</script>

<style scoped>
</style>
