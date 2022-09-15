<template>
  <div
    :id="feature_id"
    class="card mb-2"
    :class="{ 'border-primary' : selected }"
  >
    <div
      class="card-body"
      style="overflow: auto; max-height: 600px"
    >
      <FeatureInfo
        :featuregeoms="featuregeoms"
        :feature="feature"
        :feature_id="feature_id"
        @close="$emit('close')">
      </FeatureInfo>
    </div>
  </div>
</template>

<script>
import FeatureInfo from './FeatureInfo.vue';

export default {
	name: "FeatureCard",
	components: {
		FeatureInfo
	},
	props: {
		featuregeoms: Object,
		feature_id: String,
		selected: {
			type: Boolean,
			default: false
		},
		expanded: {
			type: Number,
			default: 0
		},
	},
	data() {

		return {
			edit_mode: false,
		};

	},
	computed: {
    feature: function () {
        return this.getFeature(this.feature_id);
    },
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

			return this.feature.hasOwnProperty('geometry') && this.feature.geometry !== null;

		},
		hasPlace: function () {

			return this.feature.hasOwnProperty('place') && this.feature.place !== null;

		},
	},
	methods: {
		is_mode( mode ) {

			return this.expanded === mode;

		},
		select_this() {

			this.$emit( 'object_clicked', this.feature_id );

		},
		getFeature( fid ) {

			if ( this.featuregeoms ) {

        // TODO: we just return the first feature with id=='fid' for now
				return this.featuregeoms.features.filter((feature) => feature.id.toString() === fid )[0];

			} else {

				return {};

			}

		},
	}
};
</script>
