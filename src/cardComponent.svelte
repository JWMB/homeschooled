<script lang="ts">
import { createEventDispatcher, onMount } from 'svelte'
const dispatch = createEventDispatcher();

export let value: any = "";
export let title: string = "Title";
export let body: string = "";
export let imageUrl: string = "";

let me: HTMLElement;
onMount(() => {
    dispatch("mount", { element: me });
});

</script>

<style>
  .card {
    display: inline-block;
    background-color: #FFF3CC;
    border: #DFBC6A 1px solid;
    width: 200px;
	height: 150px;
	margin: 10px;
    padding: 8px;
    font-size: 18px;
    text-align: center;
	box-shadow: 2px 2px 2px #999;
    cursor: move;
  }
</style>

<div class="card" data-value={value} bind:this={me}>
    <div>{title}</div>
    <div style="font-size: smaller">{body}</div>
    {#if imageUrl?.length > 0}
        <img src={imageUrl} alt=""/>
    {/if}
</div>
