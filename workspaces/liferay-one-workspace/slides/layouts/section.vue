<script setup lang="ts">
import { useSlideContext } from '@slidev/client'

const { $frontmatter } = useSlideContext()
</script>

<template>
	<div class="slidev-layout devcon-section">
		<img class="devcon-cover__logo" src="/devcon/logo-devcon26.png" alt="DevCon '26">
		<div v-if="$frontmatter.eyebrow" class="devcon-section__eyebrow">{{ $frontmatter.eyebrow }}</div>
		<div class="devcon-section__title"><slot /></div>
		<img class="devcon-cover__liferay" src="/devcon/logo-liferay.png" alt="Liferay">
	</div>
</template>
