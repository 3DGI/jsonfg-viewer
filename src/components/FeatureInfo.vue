<template>
  <div>
    <div class="d-flex justify-content-between align-items-center">
      <div class="text-secondary">
        <small><em>featureType:</em> {{ hasFeatureType ? feature.featureType : "not present" }}</small>
      </div>
      <div class="col-auto p-0">
        <button
          type="button"
          class="close ml-2"
          aria-label="Close"
          @click="$emit('close')"
        >
          <span aria-hidden="true"><i class="fas fa-times small"></i></span>
        </button>
      </div>
    </div>
    <h5 class="card-title text-truncate">
      {{ feature_id }}
    </h5>
    <div v-if="featuregeoms != null">
      <small v-if="isTimeDate || isTimeStamp">
        <em>time: </em>{{ isTimeStamp === true ? feature.time.timestamp : feature.time.date }}
      </small>
      <small v-else-if="isTimeInterval">
        <em>time: </em>{{ feature.time.interval[0] }}–{{ feature.time.interval[1] }}
      </small>
      <small v-else>
        <em>time: </em>null
      </small>
    </div>
    <div class="d-flex mt-2">
      <expandable-badge
        v-if="hasProperties"
        color="info"
        :expanded="is_mode(1)"
        @click="toggle_mode(1)"
      >
        {{ propertiesCount }} Properties
      </expandable-badge>
    </div>
    <div v-show="expanded">
      <hr>
      <div v-show="is_mode(1)">
        <div v-show="propertiesCount > 0">
          <table class="table table-striped table-borderless overflow-auto">
            <tbody>
              <tr
                v-for="(value, key) in feature.properties"
                :key="key"
              >
                <th
                  scope="row"
                  class="py-1"
                >
                  <small class="font-weight-bold">{{ key }}</small>
                </th>
                <td class="py-1">
                  <small>{{ value }}</small>
                </td>
              </tr>
            </tbody>
          </table>
          <hr>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

import ExpandableBadge from "./ExpandableBadge";

export default {
	name: "FeatureInfo",
	components: {
		ExpandableBadge,
	},
	props: {
		featuregeoms: Object,
		feature: Object,
		feature_id: String,
		selected: {
			type: Boolean,
			default: false,
		},
	},
	data() {

		return {
			expanded: 0,
		};

	},
	computed: {
		propertiesCount: function () {

			if ( "properties" in this.feature ) {

				return Object.keys( this.feature.properties ).length;

			}

			return 0;

		},
		hasProperties: function () {

			return this.propertiesCount > 0;

		},
		hasGeometry: function () {

			return this.feature.hasOwnProperty('geometry') ? this.feature.geometry !== null : false;

		},
		hasPlace: function () {

			return this.feature.hasOwnProperty('place') ? this.feature.place !== null : false;

		},
    isTimeDate: function () {
      return this.feature.hasOwnProperty('time') ? this.feature.time !== null && this.feature.time.hasOwnProperty('date') : false;
    },
    isTimeStamp: function () {
      return this.feature.hasOwnProperty('time') ? this.feature.time !== null && this.feature.time.hasOwnProperty('timestamp') : false;
    },
    isTimeInterval: function () {
      return this.feature.hasOwnProperty('time') ? this.feature.time !== null && this.feature.time.hasOwnProperty('interval') : false;
    },
    hasFeatureType: function () {
      return this.feature.hasOwnProperty('featureType');
    }
	},
	methods: {
		toggle_mode( mode ) {

			if ( this.expanded === mode ) {

				this.expanded = 0;

			} else {

				this.expanded = mode;

			}

		},
		is_mode( mode ) {

			return this.expanded === mode;

		},
		getFeature( fid ) {

			if ( this.featuregeoms ) {

        // TODO: we just return the first feature with id=='fid' for now
				return this.featuregeoms.features.filter((feature) => feature.id.toString() === fid )[0];

			} else {

				return {};

			}

		},
	},
};
</script>
