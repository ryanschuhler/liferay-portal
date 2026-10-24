<script setup lang="ts">
import { useSlideContext } from '@slidev/client'

const { $frontmatter } = useSlideContext()
</script>

<template>
	<div class="slidev-layout devcon-cover">
		<img class="devcon-cover__logo" src="/devcon/logo-devcon26.png" alt="DevCon '26">
		<div v-if="$frontmatter.eyebrow" class="devcon-cover__eyebrow">{{ $frontmatter.eyebrow }}</div>
		<div class="devcon-cover__title"><slot /></div>
		<div v-if="$frontmatter.speaker" class="devcon-cover__speaker">
			<div class="devcon-cover__avatar" />
			<div>
				<div class="devcon-cover__name">{{ $frontmatter.speaker }}</div>
				<div class="devcon-cover__role">{{ $frontmatter.role }}</div>
			</div>
		</div>
		<img class="devcon-cover__liferay" src="/devcon/logo-liferay.png" alt="Liferay">
	</div>
</template>
