<template lang="pug">
    .Page(:style="cssVars")
        .Drag(@mousedown="onDragdown" @mouseup="onDragup")
            .Handle |
        .OutputPanel
            .Json(v-if="output.length")
                .JsonNode(v-for="node of output"  :key="node.id" :ref="node.id" :id="node.path" :class="{highlighted: node.highlighted}")
                    .indent(v-for="i in node.level") {{' '}}
                    span.key(v-if="node.key") {{node.key}}:&nbsp;
                    span
                        span.brackets(v-if="node.isContent === false") {{node.content}}
                        span.value(v-else :class="'value-' + node.type") {{formatValue(node)}}
                        span.comma(v-if="node.showComma") ,
            .Explainer(v-else)
                h4 Hero Output
                p This panel shows output set using "hero.output".
                p You can use the "hero.output" object as an array:
                pre
                    | hero.output.push({
                    |   text,
                    |   href,
                    | })
                p Or as an object:
                pre
                    | hero.output.text = text;
                p As you set each data-entry, it will stream into this panel as the same json you'll get if you print hero.output:
                pre console.log(hero.output);
            .Datasize(v-if="dataSize") Output size: {{dataSize}}
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import { ipcRenderer } from 'electron';
import { getTheme } from '~shared/utils/themes';
import settings from '~frontend/lib/settings';
import NoCache from '~frontend/lib/NoCache';
import flattenJson, { FlatJson } from '~frontend/pages/output/flattenJson';

@Component
export default class OutputPanel extends Vue {
  private output: FlatJson[] = [];

  private isResizing = false;
  private lastResizeScreenX: number;
  private dataSize: string = null;

  private get theme() {
    return getTheme(settings.theme);
  }

  private formattedSize(bytes: number): string {
    if (!bytes) return null;

    const kb = bytes / 1024;
    if (kb > 1024) {
      const mb = kb / 1024;
      return `${Math.round(mb * 10) / 10}mb`;
    }
    return `${Math.round(kb * 10) / 10}kb`;
  }

  private formatValue(node: FlatJson): string {
    let text = node.content + '';
    if (node.type === 'string') text = `"${text}"`;
    return text;
  }

  @NoCache
  private get cssVars() {
    return {
      '--toolbarBackgroundColor': this.theme.toolbarBackgroundColor,
      '--toolbarBorderColor': this.theme.toolbarBottomLineBackgroundColor,
    };
  }

  mounted() {
    ipcRenderer.on(
      'set:output',
      (_, output: any, bytes: number, changes: { path: string; type: string }[]) => {
        if (output === null || bytes === 0) {
          this.dataSize = null;
          this.output = [];
          return;
        }
        const json = flattenJson(output);
        let counter = 0;
        let recordToScroll: FlatJson;
        for (const record of json) {
          record.id = counter += 1;
          if (changes && changes.some(x => x.path && record.path.startsWith(x.path))) {
            record.highlighted = true;
            recordToScroll = record;
          }
        }
        this.dataSize = this.formattedSize(bytes);
        this.output = json;
        if (recordToScroll) {
          this.$nextTick(() => {
            const refs = this.$refs[recordToScroll.id] as HTMLElement[];
            if (!refs) return;
            if (refs.length) {
              refs[refs.length - 1].scrollIntoView({ block: 'center' });
            }
          });
        }
      },
    );
    window.addEventListener('mouseup', this.onDragup);
  }

  private onDragdown() {
    window.addEventListener('mousemove', this.onDragmove);
    this.isResizing = true;
  }

  private onDragup() {
    window.removeEventListener('mousemove', this.onDragmove);
    this.isResizing = false;
  }

  private onDragmove(event) {
    const start = this.lastResizeScreenX;
    this.lastResizeScreenX = event.screenX;
    if (this.isResizing && start !== undefined) {
      const moveX = start - this.lastResizeScreenX;
      if (moveX !== 0) {
        ipcRenderer.send('output-drag', moveX);
      }
    }
  }
}
</script>

<style lang="scss">
@import '../../assets/style/resets';
body {
  height: 100vh;
  margin: 0;
  border-top: 0 none;
  width: 100%;
}
.Page {
  box-sizing: border-box;
  background: white;
  border-left: 1px solid var(--toolbarBorderColor);
  box-shadow: inset 1px 0 rgba(0, 0, 0, 0.2);
  margin: 0;
}
.vjs-tree {
  font-size: 12px;
}
.Drag {
  position: absolute;
  z-index: 1;
  user-select: none;
  top: 50%;
  .Handle {
    position: relative;
    left: -8px;
    height: 30px;
    background: #aaaaaa;
    width: 16px;
    border-radius: 5px;
    text-align: center;
    color: white;
    text-indent: 5px;
    vertical-align: middle;
    line-height: 30px;
  }
}
.OutputPanel {
  box-sizing: border-box;
  padding: 20px 10px;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  height: 100%;
  width: 100%;

  h4 {
    text-align: center;
    text-decoration: underline;
    margin-top: 0;
    margin-bottom: 5px;
  }
  .Json {
    font-family: 'Monaco', 'Menlo', 'Consolas', 'Bitstream Vera Sans Mono', monospace;
    font-size: 12px;
    text-align: left;
  }
}

.Explainer {
  margin: 5px;
  border-radius: 5px;
  border: 1px solid #e2ecec;
  background: #eeeeee;
  padding: 10px;
}

.Datasize {
  text-align: center;
  font-style: italic;
  color: #3c3c3c;
}
.JsonNode {
  display: flex;
  position: relative;
  &.highlighted {
    background-color: #f3fbff;
  }
  .key {
    padding-right: 5px;
  }
  .brackets,
  .comma {
    color: #949494;
  }
  .indent {
    flex: 0 0 1em;
    border-left: 1px dashed #d9d9d9;
  }
  .comment {
    color: #bfcbd9;
  }

  .value-null {
    color: #ff4949;
  }

  .value-number {
    color: #1d8ce0;
  }

  .value-boolean {
    color: #1d8ce0;
  }

  .value-string {
    color: #13ce66;
  }
}
</style>
