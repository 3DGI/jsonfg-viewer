<template>
  <ul class="list-unstyled overflow-auto px-3">
    <FeatureCollectionTreeItem
            v-for="(feature, index) in featurecollection"
            v-show="matches(feature)"
            :key="feature.id.toString()"
            :featuregeoms="featuregeoms"
            :item="feature"
            :feature_id="feature.id.toString()"
            :feature_idx="index"
            :selected_fid="selected_fid"
            @object_clicked="$emit('object_clicked', $event)"
    />
  </ul>
</template>

<script>
    import FeatureCollectionTreeItem from "./FeatureCollectionTreeItem";

    export default {
        name: "FeatureCollectionTree",
        components: {FeatureCollectionTreeItem},
        props: {
            featurecollection: Array,
            selected_fid: String,
            featuregeoms: Object,
            matches: {
                type: Function,
                default: function () {
                    return true;
                }
            }
        }
    }
</script>
