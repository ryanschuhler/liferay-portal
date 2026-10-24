<script setup lang="ts">
import { useSlideContext } from '@slidev/client'

const { $frontmatter } = useSlideContext()
</script>

<template>
	<div class="slidev-layout devcon-content">
		<div v-if="$frontmatter.eyebrow" class="devcon-eyebrow">{{ $frontmatter.eyebrow }}</div>
		<div class="devcon-content__body"><slot /></div>
		<img class="devcon-footer" src="/devcon/footer.png" alt="DevCon and Liferay">
	</div>
</template>
