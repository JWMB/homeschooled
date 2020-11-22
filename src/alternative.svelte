<script lang="ts">
import { createEventDispatcher, onMount } from 'svelte';

const dispatch = createEventDispatcher();
export let text: string;
export let text2: string = "";
export let flagSvg: string;
export let alternativeId: string;
export let selected: boolean = false;
let me;

$: if (!!me && !!flagSvg && flagSvg.length) {
    me.innerHTML = flagSvg;
}
$: selected = selected;

onMount(async () => {
    if (!!flagSvg && flagSvg.length) {
        me.innerHTML = flagSvg;
    }
});
function choose() {
    dispatch('message', {
        text: text,
        alternativeId: alternativeId
    });
}
//class:selected={selected}
</script>

<div class="response-option {selected ? 'selected' : ''}"  on:click="{choose}"> 
    <div class="country-name">{text}</div>
    <div class="country-name">{text2}</div>
    {#if flagSvg != null}
    <div class="flag" bind:this={me}></div>
    {/if}
</div>