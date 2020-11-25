<script lang="ts">
import { createEventDispatcher, onMount } from 'svelte';

const dispatch = createEventDispatcher();
export let title: string = "";
export let text: string;
export let html: string;
export let alternativeId: string;
export let selected: boolean = false;
let me;

$: if (!!me && !!html && html.length) {
    me.innerHTML = html;
}
$: selected = selected;

onMount(async () => {
    if (!!html && html.length) {
        me.innerHTML = html;
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
    <div class="title">{title || ""}</div>
    <div class="text">{text || ""}</div>
    {#if html != null}
    <div class="flag" bind:this={me}></div>
    {/if}
</div>