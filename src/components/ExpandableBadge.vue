<!-- cityjson-vue-components ExpandableBadge.vue

https://github.com/cityjson/cityjson-vue-components

Copyright 2022 Delft University of Technology

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.-->
<template>
  <div
    class="badge badge-pill mr-2"
    :class="bootstrapColorClass"
  >
    <a
      href="#"
      class="text-decoration-none"
      :class="bootstrapTextClass"
      @click="$emit('click')"
    ><slot></slot> <i
      class="fas ml-1"
      :class="[ expanded ? 'fa-chevron-up' : 'fa-chevron-down' ]"
    ></i></a>
  </div>
</template>

<script>
export default {
	name: 'ExpandableBadge',
	props: {
		expanded: Boolean,
		color: {
			type: String,
			default: 'danger'
		},
		outline: {
			type: Boolean,
			default: true,
		}
	},
	computed: {
		bootstrapColorClass: function () {

			if ( this.outline && ! this.expanded ) {

				return [ 'bg-white', 'border', 'border-' + this.color ];

			}

			return [ 'border', 'border-' + this.color, 'badge-' + this.color ];

		},
		bootstrapTextClass: function () {

			if ( this.outline && ! this.expanded ) {

				return 'text-' + this.color;

			}

			return 'text-white';

		}
	}
};
</script>
