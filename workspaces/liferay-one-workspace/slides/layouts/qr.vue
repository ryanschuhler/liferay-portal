<script setup lang="ts">
import { useSlideContext } from '@slidev/client'

const { $frontmatter } = useSlideContext()
</script>

<template>
	<div class="slidev-layout devcon-qr">
		<img v-if="$frontmatter.qr" class="devcon-qr__code" :src="$frontmatter.qr" alt="QR code">
		<div v-else class="devcon-qr__code devcon-qr__code--placeholder">Insert your<br>QR Code here!</div>
		<div class="devcon-qr__body"><slot /></div>
		<img class="devcon-footer" src="/devcon/footer.png" alt="DevCon and Liferay">
	</div>
</template>
