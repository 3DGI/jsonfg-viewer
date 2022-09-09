<template>
  <li :id="feature_id">
    <div class="d-flex flex-inline align-items-center">
      <a
              href="#"
              class="text-dark text-decoration-none mr-1"
              @click="select_this"
      ><span :class="{ 'text-primary' : selected }">{{ feature_id }}</span></a>
    </div>
  </li>
</template>

<script>
    export default {
        name: "FeatureCollectionTreeItem",
        props: {
            item: Object,
            feature_id: String,
            selected_fid: String,
            featuregeoms: Object
        },
        data: function () {
            return {
                isOpen: false
            };
        },
        computed: {
            selected: function () {
                return this.feature_id === this.selected_fid;
            }
        },
        methods: {
            select_this() {
                this.$emit("object_clicked", this.feature_id);
            },
            getFeature(fid) {
                return this.featuregeoms.features[fid];
            }
        }
    }
</script>

<style>
    .object-icon {
        width: 24px;
    }
</style>