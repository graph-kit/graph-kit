<script setup lang="ts">
  import DropdownItem from '@core/components/DropdownItem';
</script>

<template>
  <!-- the highlight background marks keyboard position, so a focus ring on top of it is redundant -->
  <!-- data-[highlighted] stays bracketed to match the base class tailwind-merge dedupes it against -->
  <DropdownItem
    class="focus-visible:ring-0 focus-visible:ring-offset-0 hover:bg-gray-100 focus-visible:bg-gray-100 data-[highlighted]:bg-gray-100 dark:text-white dark:hover:bg-gray-700 dark:focus-visible:bg-gray-700 dark:data-[highlighted]:bg-gray-700"
  >
    <slot />
  </DropdownItem>
</template>
