<template>
  <Teleport to="body">
      <div
        class="modal-overlay"
        data-testid="player-stats-modal-overlay"
        @click.self="$emit('close')"
      >
        <div class="modal-box player-stats-modal">
          <div class="modal-title">数据统计</div>
          <div class="player-stats-modal-tabs detail-tabs">
            <button
              type="button"
              class="detail-tab"
              data-testid="player-stats-tab-summary"
              :class="{ active: playerStatsModalTab === 'summary' }"
              @click="playerStatsModalTab = 'summary'"
            >
              概览
            </button>
            <button
              type="button"
              class="detail-tab"
              data-testid="player-stats-tab-timeline"
              :class="{ active: playerStatsModalTab === 'timeline' }"
              @click="playerStatsModalTab = 'timeline'"
            >
              场次趋势
            </button>
            <button
              type="button"
              class="detail-tab"
              data-testid="player-stats-tab-damage"
              :class="{ active: playerStatsModalTab === 'damage' }"
              @click="playerStatsModalTab = 'damage'"
            >
              伤害统计
            </button>
            <button
              type="button"
              class="detail-tab"
              data-testid="player-stats-tab-injury"
              :class="{ active: playerStatsModalTab === 'injury' }"
              @click="playerStatsModalTab = 'injury'"
            >
              受伤统计
            </button>
          </div>

          <div class="player-stats-modal-body game-scroll-alt">
          <template v-if="playerStatsModalTab === 'summary'">
            <div class="detail-skill-choice-banner player-stats-banner">
              <p>
                探索步（战斗行动步 + 休息步）<strong>{{ explorationStepsDisplay }}</strong>；本周期累计获得金币
                <strong class="val-gold">{{ playerStats.cumulativeGold }}</strong>、经验 <strong class="val-exp">{{ playerStats.cumulativeXp }}</strong>。
              </p>
              <p>
                展示倍率：
                <button type="button" class="btn-scale" :class="{ active: statsScaleN === 1 }" @click="setStatsDisplayScale(1)">每步</button>
                <button type="button" class="btn-scale" :class="{ active: statsScaleN === 10 }" @click="setStatsDisplayScale(10)">每10步</button>
                <button type="button" class="btn-scale" :class="{ active: statsScaleN === 100 }" @click="setStatsDisplayScale(100)">每100步</button>
              </p>
            </div>
            <div class="player-stats-damage-card player-stats-win-rate-card" data-testid="player-stats-win-rate-section">
              <div class="player-stats-damage-card-title">战斗胜负</div>
              <p class="player-stats-win-rate-summary">
                总场次 <strong class="player-stats-win-rate-total" data-testid="player-stats-battle-count">{{ playerStatsWinRateSummary.battleCount }}</strong>；
                胜利 <strong class="val-victory">{{ playerStatsWinRateSummary.victoryCount }}</strong>；
                胜率 <strong>{{ playerStatsWinRateSummary.winRatePct }}%</strong>
              </p>
              <div
                v-if="playerStatsWinRateSummary.battleCount <= 0"
                class="player-stats-damage-mini-empty"
                data-testid="player-stats-win-rate-empty"
              >
                本周期暂无战斗记录。
              </div>
              <div v-else class="player-stats-pie-row">
                <svg
                  class="player-stats-pie-svg"
                  :viewBox="playerStatsWinRatePie.viewBox"
                  preserveAspectRatio="xMidYMid meet"
                  aria-label="胜率饼图"
                  data-testid="player-stats-win-rate-pie"
                >
                  <template v-if="!playerStatsWinRatePie.model.empty">
                    <template v-for="(sl, si) in playerStatsWinRatePie.model.slices" :key="'win-' + si">
                      <circle
                        v-if="sl.kind === 'full'"
                        class="player-stats-pie-slice"
                        :cx="sl.cx"
                        :cy="sl.cy"
                        :r="sl.r"
                        :fill="sl.fill"
                      />
                      <path
                        v-else
                        class="player-stats-pie-slice"
                        :d="sl.d"
                        :fill="sl.fill"
                      />
                    </template>
                  </template>
                </svg>
                <ul class="player-stats-pie-legend" aria-label="胜率图例">
                  <li v-for="leg in playerStatsWinRatePie.legend" :key="'win-leg-' + leg.key">
                    <span class="player-stats-legend-swatch" :style="{ background: leg.fill }" aria-hidden="true" />
                    <span class="player-stats-legend-name" :style="{ color: leg.fill }">{{ leg.label }}</span>
                    <span class="player-stats-legend-val">{{ leg.value }}</span>
                    <span class="player-stats-legend-pct">{{ leg.pctLabel }}</span>
                  </li>
                </ul>
              </div>
            </div>
            <div v-if="resetStatsConfirming" class="player-stats-reset-confirm detail-skill-choice-banner">
              <p>确定清零统计数据？将重置本周期累计步数、收益、战斗胜负、场次趋势列表与伤害/受伤累计。</p>
              <div class="player-stats-reset-actions player-stats-modal-inline-btns">
                <button type="button" class="btn btn-danger player-stats-compact-btn" data-testid="player-stats-reset-confirm" @click="$emit('reset')">确定清零</button>
                <button type="button" class="btn player-stats-compact-btn" @click="resetStatsConfirming = false">取消</button>
              </div>
            </div>
            <div v-else class="player-stats-actions player-stats-modal-inline-btns">
              <button type="button" class="btn btn-danger player-stats-compact-btn" data-testid="player-stats-reset-open" @click="resetStatsConfirming = true">清零统计</button>
            </div>
          </template>

          <template v-else-if="playerStatsModalTab === 'timeline'">
            <div v-if="playerStatsBattleTimeline.length === 0" class="player-stats-timeline-empty" data-testid="player-stats-timeline-empty">
              本周期暂无战斗记录。开战后会自动追加；也可先在其他 Tab 查看概览。
            </div>
            <div
              v-else
              class="player-stats-chart-shell"
              data-testid="player-stats-timeline-chart"
              @mousemove="onPlayerStatsChartMouseMove"
              @mouseleave="clearPlayerStatsChartHover"
            >
              <svg
                class="player-stats-trend-svg"
                :viewBox="playerStatsTimelineChartModel.viewBox"
                preserveAspectRatio="xMidYMid meet"
                aria-label="场次趋势图"
              >
                <rect
                  class="player-stats-chart-grid-bg"
                  :x="playerStatsTimelineChartModel.plot.x"
                  :y="playerStatsTimelineChartModel.plot.y"
                  :width="playerStatsTimelineChartModel.plot.w"
                  :height="playerStatsTimelineChartModel.plot.h"
                  rx="4"
                />
                <line
                  v-for="(seg, gi) in playerStatsTimelineChartModel.hGrid"
                  :key="'gh-' + gi"
                  class="player-stats-grid-line"
                  :x1="seg.x1"
                  :y1="seg.y1"
                  :x2="seg.x2"
                  :y2="seg.y2"
                />
                <line
                  v-for="(seg, gi) in playerStatsTimelineChartModel.vGrid"
                  :key="'gv-' + gi"
                  class="player-stats-grid-line player-stats-grid-line-v"
                  :x1="seg.x1"
                  :y1="seg.y1"
                  :x2="seg.x2"
                  :y2="seg.y2"
                />
                <text
                  v-for="(t, ti) in playerStatsTimelineChartModel.yAxisTicks"
                  :key="'yl-' + ti"
                  class="player-stats-axis-label player-stats-axis-y-num"
                  :x="playerStatsTimelineChartModel.plot.x - 6"
                  :y="t.y + 4"
                  text-anchor="end"
                >{{ t.label }}</text>
                <text
                  v-for="(t, ti) in playerStatsTimelineChartModel.xBattleTicks"
                  :key="'xb-' + ti"
                  class="player-stats-axis-label player-stats-axis-x"
                  :x="t.x"
                  :y="playerStatsTimelineChartModel.plot.y + playerStatsTimelineChartModel.plot.h + 22"
                  text-anchor="middle"
                >{{ t.label }}</text>
                <text class="player-stats-axis-title-x" :x="playerStatsTimelineChartModel.plot.x + playerStatsTimelineChartModel.plot.w / 2" :y="playerStatsTimelineChartModel.plot.y + playerStatsTimelineChartModel.plot.h + 38" text-anchor="middle">
                  场次序号
                </text>
                <polyline
                  v-if="playerStatsTimelineChartModel.stepsLine"
                  fill="none"
                  :points="playerStatsTimelineChartModel.stepsLine"
                  class="player-stats-line-steps"
                />
                <polyline
                  v-if="playerStatsTimelineChartModel.xpLine"
                  fill="none"
                  :points="playerStatsTimelineChartModel.xpLine"
                  class="player-stats-line-xp"
                />
                <polyline
                  v-if="playerStatsTimelineChartModel.goldLine"
                  fill="none"
                  :points="playerStatsTimelineChartModel.goldLine"
                  class="player-stats-line-gold"
                />
                <circle
                  v-for="(mk, mi) in playerStatsTimelineChartModel.pointMarkers"
                  :key="'mk-' + mi"
                  :cx="mk.cx"
                  :cy="mk.cy"
                  r="3.5"
                  class="player-stats-point-marker"
                  :class="'marker-' + mk.kind"
                />
                <g class="player-stats-svg-legend" pointer-events="none">
                  <text :x="playerStatsTimelineChartModel.plot.x + 6" :y="14" class="player-stats-svg-legend-label legend-svg-steps">步数</text>
                  <text :x="playerStatsTimelineChartModel.plot.x + 52" :y="14" class="player-stats-svg-legend-label legend-svg-gold">金币</text>
                  <text :x="playerStatsTimelineChartModel.plot.x + 104" :y="14" class="player-stats-svg-legend-label legend-svg-xp">经验</text>
                </g>
              </svg>
            </div>
          </template>

          <template v-else-if="playerStatsModalTab === 'damage'">
            <div class="detail-skill-choice-banner player-stats-banner tooltip-wrap has-tip">
              <p>
                自上次清零起累计<strong>对敌方伤害</strong>；各角色饼图按<strong>普攻与各技能</strong>拆分。不含无法在日志中单次归因的持续伤害等。
              </p>
              <span class="tooltip-text">每场战斗结束时根据本场日志增量汇总；各角色饼图扇区或图例行悬停显示数值与占比。点击「清零统计」将清空本节数据。</span>
            </div>
            <div
              v-if="playerStatsDamageSquadTotal <= 0"
              class="player-stats-damage-empty"
              data-testid="player-stats-damage-empty"
            >
              本周期暂无累计伤害数据。进行战斗后会自动写入。
            </div>
            <div v-else class="player-stats-damage-layout" data-testid="player-stats-damage-section">
              <div class="player-stats-damage-card player-stats-damage-card-wide">
                <div class="player-stats-damage-card-title">小队伤害占比</div>
                <div class="player-stats-pie-row">
                  <svg
                    class="player-stats-pie-svg"
                    :viewBox="playerStatsDamageSharePie.viewBox"
                    preserveAspectRatio="xMidYMid meet"
                    aria-label="小队伤害占比饼图"
                  >
                    <template v-if="!playerStatsDamageSharePie.model.empty">
                      <template v-for="(sl, si) in playerStatsDamageSharePie.model.slices" :key="'share-' + si">
                        <circle
                          v-if="sl.kind === 'full'"
                          class="player-stats-pie-slice"
                          :cx="sl.cx"
                          :cy="sl.cy"
                          :r="sl.r"
                          :fill="sl.fill"
                        />
                        <path
                          v-else
                          class="player-stats-pie-slice"
                          :d="sl.d"
                          :fill="sl.fill"
                        />
                      </template>
                    </template>
                    <circle
                      v-else
                      class="player-stats-pie-hole-fallback"
                      :cx="playerStatsDamageSharePie.model.cx"
                      :cy="playerStatsDamageSharePie.model.cy"
                      :r="playerStatsDamageSharePie.model.r"
                      fill="none"
                      stroke="var(--border-dark)"
                      stroke-dasharray="4 3"
                    />
                  </svg>
                  <ul class="player-stats-pie-legend" aria-label="占比图例">
                    <li v-for="leg in playerStatsDamageSharePie.legend" :key="'leg-' + leg.heroId">
                      <span class="player-stats-legend-swatch" :style="{ background: leg.color }" aria-hidden="true" />
                      <span class="player-stats-legend-name" :style="{ color: leg.color }">{{ leg.heroLabel }}</span>
                      <span class="player-stats-legend-val">{{ leg.total }}</span>
                      <span class="player-stats-legend-pct">{{ leg.pctLabel }}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div class="player-stats-damage-grid-title">各角色伤害构成</div>
              <div class="player-stats-damage-grid">
                <div
                  v-for="row in playerStatsPerHeroDamagePies"
                  :key="'dmg-' + row.heroId"
                  class="player-stats-damage-card"
                >
                  <div class="player-stats-damage-card-title" :style="{ color: classColor(row.heroClass) }">
                    {{ row.heroLabel }}
                  </div>
                  <div v-if="row.total <= 0" class="player-stats-damage-mini-empty">暂无累计伤害</div>
                  <template v-else>
                    <div
                      class="player-stats-pie-row player-stats-pie-row-compact player-stats-pie-hover-zone"
                      @mouseleave="clearCompPieHover"
                    >
                      <svg
                        class="player-stats-pie-svg player-stats-pie-svg-compact"
                        :viewBox="row.viewBox"
                        preserveAspectRatio="xMidYMid meet"
                        :aria-label="row.heroLabel + ' 伤害构成'"
                        @mousemove="onCompPieHoverMove"
                      >
                        <template v-for="(sl, si) in row.model.slices" :key="'comp-' + row.heroId + '-' + si">
                          <circle
                            v-if="sl.kind === 'full'"
                            class="player-stats-pie-slice player-stats-pie-slice-hoverable"
                            :cx="sl.cx"
                            :cy="sl.cy"
                            :r="sl.r"
                            :fill="sl.fill"
                            @mouseenter="onCompPieSliceHover($event, sl)"
                          />
                          <path
                            v-else
                            class="player-stats-pie-slice player-stats-pie-slice-hoverable"
                            :d="sl.d"
                            :fill="sl.fill"
                            @mouseenter="onCompPieSliceHover($event, sl)"
                          />
                        </template>
                      </svg>
                      <ul class="player-stats-pie-legend player-stats-pie-legend-compact player-stats-pie-legend-skill-only" :aria-label="row.heroLabel + ' 构成图例'">
                        <li
                          v-for="leg in row.legend"
                          :key="'cleg-' + row.heroId + '-' + leg.key"
                          @mouseenter="onCompPieLegendHover($event, row, leg)"
                          @mousemove="onCompPieHoverMove"
                        >
                          <span class="player-stats-legend-swatch" :style="{ background: leg.fill }" aria-hidden="true" />
                          <span
                            class="player-stats-legend-name"
                            :class="{ 'player-stats-legend-skill': leg.key !== '__basic__' }"
                            :style="leg.key !== '__basic__' ? { color: 'var(--color-skill)', fontStyle: 'italic' } : {}"
                          >{{ leg.label }}</span>
                        </li>
                      </ul>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </template>

          <template v-else-if="playerStatsModalTab === 'injury'">
            <div class="detail-skill-choice-banner player-stats-banner tooltip-wrap has-tip">
              <p>
                自上次清零起累计<strong>我方所受伤害</strong>（含护盾吸收）；各角色饼图按<strong>敌方普攻（物理/魔法）与技能</strong>拆分。不含无法在日志中单次归因的持续伤害等。
              </p>
              <span class="tooltip-text tooltip-wide">每场战斗结束时根据本场日志增量汇总；数值按有效伤害（含被护盾吸收部分）统计。各角色饼图扇区或图例行悬停显示数值与占比。点击「清零统计」将清空本节数据。</span>
            </div>
            <div
              v-if="playerStatsInjurySquadTotal <= 0"
              class="player-stats-damage-empty"
              data-testid="player-stats-injury-empty"
            >
              本周期暂无累计受伤数据。进行战斗后会自动写入。
            </div>
            <div v-else class="player-stats-damage-layout" data-testid="player-stats-injury-section">
              <div class="player-stats-damage-card player-stats-damage-card-wide">
                <div class="player-stats-damage-card-title">小队受伤占比</div>
                <div class="player-stats-pie-row">
                  <svg
                    class="player-stats-pie-svg"
                    :viewBox="playerStatsInjurySharePie.viewBox"
                    preserveAspectRatio="xMidYMid meet"
                    aria-label="小队受伤占比饼图"
                  >
                    <template v-if="!playerStatsInjurySharePie.model.empty">
                      <template v-for="(sl, si) in playerStatsInjurySharePie.model.slices" :key="'inj-share-' + si">
                        <circle
                          v-if="sl.kind === 'full'"
                          class="player-stats-pie-slice"
                          :cx="sl.cx"
                          :cy="sl.cy"
                          :r="sl.r"
                          :fill="sl.fill"
                        />
                        <path
                          v-else
                          class="player-stats-pie-slice"
                          :d="sl.d"
                          :fill="sl.fill"
                        />
                      </template>
                    </template>
                    <circle
                      v-else
                      class="player-stats-pie-hole-fallback"
                      :cx="playerStatsInjurySharePie.model.cx"
                      :cy="playerStatsInjurySharePie.model.cy"
                      :r="playerStatsInjurySharePie.model.r"
                      fill="none"
                      stroke="var(--border-dark)"
                      stroke-dasharray="4 3"
                    />
                  </svg>
                  <ul class="player-stats-pie-legend" aria-label="受伤占比图例">
                    <li v-for="leg in playerStatsInjurySharePie.legend" :key="'inj-leg-' + leg.heroId">
                      <span class="player-stats-legend-swatch" :style="{ background: leg.color }" aria-hidden="true" />
                      <span class="player-stats-legend-name" :style="{ color: leg.color }">{{ leg.heroLabel }}</span>
                      <span class="player-stats-legend-val">{{ leg.total }}</span>
                      <span class="player-stats-legend-pct">{{ leg.pctLabel }}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div class="player-stats-damage-grid-title">各角色受伤构成</div>
              <div class="player-stats-damage-grid">
                <div
                  v-for="row in playerStatsPerHeroInjuryPies"
                  :key="'inj-' + row.heroId"
                  class="player-stats-damage-card"
                >
                  <div class="player-stats-damage-card-title" :style="{ color: classColor(row.heroClass) }">
                    {{ row.heroLabel }}
                  </div>
                  <div v-if="row.total <= 0" class="player-stats-damage-mini-empty">暂无累计受伤</div>
                  <template v-else>
                    <div
                      class="player-stats-pie-row player-stats-pie-row-compact player-stats-pie-hover-zone"
                      @mouseleave="clearCompPieHover"
                    >
                      <svg
                        class="player-stats-pie-svg player-stats-pie-svg-compact"
                        :viewBox="row.viewBox"
                        preserveAspectRatio="xMidYMid meet"
                        :aria-label="row.heroLabel + ' 受伤构成'"
                        @mousemove="onCompPieHoverMove"
                      >
                        <template v-for="(sl, si) in row.model.slices" :key="'inj-comp-' + row.heroId + '-' + si">
                          <circle
                            v-if="sl.kind === 'full'"
                            class="player-stats-pie-slice player-stats-pie-slice-hoverable"
                            :cx="sl.cx"
                            :cy="sl.cy"
                            :r="sl.r"
                            :fill="sl.fill"
                            @mouseenter="onCompPieSliceHover($event, sl)"
                          />
                          <path
                            v-else
                            class="player-stats-pie-slice player-stats-pie-slice-hoverable"
                            :d="sl.d"
                            :fill="sl.fill"
                            @mouseenter="onCompPieSliceHover($event, sl)"
                          />
                        </template>
                      </svg>
                      <ul class="player-stats-pie-legend player-stats-pie-legend-compact player-stats-pie-legend-skill-only" :aria-label="row.heroLabel + ' 受伤构成图例'">
                        <li
                          v-for="leg in row.legend"
                          :key="'inj-cleg-' + row.heroId + '-' + leg.key"
                          @mouseenter="onCompPieLegendHover($event, row, leg)"
                          @mousemove="onCompPieHoverMove"
                        >
                          <span class="player-stats-legend-swatch" :style="{ background: leg.fill }" aria-hidden="true" />
                          <span
                            class="player-stats-legend-name"
                            :class="{ 'player-stats-legend-skill': !isInjuryBasicPieKey(leg.key) }"
                            :style="!isInjuryBasicPieKey(leg.key) ? { color: 'var(--color-skill)', fontStyle: 'italic' } : {}"
                          >{{ leg.label }}</span>
                        </li>
                      </ul>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </template>
          </div>

          <div class="player-stats-modal-footer">
            <button type="button" class="btn player-stats-compact-btn" data-testid="player-stats-modal-close" @click="$emit('close')">关闭</button>
          </div>
        </div>
      </div>
      <div
        v-if="playerStatsModalTab === 'timeline' && statsTimelineHoverIdx !== null && playerStatsBattleTimeline[statsTimelineHoverIdx]"
        class="player-stats-chart-tooltip player-stats-chart-tooltip-floating"
        :style="{
          left: statsTimelineTooltipLeftPx + 'px',
          top: statsTimelineTooltipTopPx + 'px',
        }"
        role="tooltip"
      >
        <div class="player-stats-chart-tooltip-title">第 {{ statsTimelineHoverIdx + 1 }} 场</div>
        <div>步数 <span class="tip-val-steps">{{ playerStatsBattleTimeline[statsTimelineHoverIdx].steps }}</span></div>
        <div>金币 <span class="tip-val-gold">{{ playerStatsBattleTimeline[statsTimelineHoverIdx].goldGained }}</span></div>
        <div>经验 <span class="tip-val-xp">{{ playerStatsBattleTimeline[statsTimelineHoverIdx].xpGained }}</span></div>
      </div>
      <div
        v-if="(playerStatsModalTab === 'damage' || playerStatsModalTab === 'injury') && compPieHover"
        class="player-stats-chart-tooltip player-stats-chart-tooltip-floating player-stats-comp-pie-tooltip"
        :style="{
          left: compPieTooltipLeftPx + 'px',
          top: compPieTooltipTopPx + 'px',
        }"
        role="tooltip"
      >
        <div class="player-stats-chart-tooltip-title">{{ compPieHover.label }}</div>
        <div>
          <span class="tip-val-dmg">{{ compPieHover.value }}</span>
          <span class="player-stats-comp-pie-pct"> ({{ compPieHover.pctLabel }})</span>
        </div>
      </div>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { CLASS_COLORS } from '../../data/heroes.js'
import { isInjuryBasicPieKey } from '../../game/playerStatsHeroInjuryPie.js'

const {
  playerStats,
  explorationStepsDisplay,
  statsScaleN,
  playerStatsWinRatePie,
  playerStatsWinRateSummary,
  playerStatsBattleTimeline,
  playerStatsTimelineChartModel,
  playerStatsDamageSharePie,
  playerStatsDamageSquadTotal,
  playerStatsPerHeroDamagePies,
  playerStatsInjurySharePie,
  playerStatsInjurySquadTotal,
  playerStatsPerHeroInjuryPies,
} = defineProps({
  playerStats: { type: Object, required: true },
  explorationStepsDisplay: { type: [String, Number], default: '' },
  statsScaleN: { type: Number, default: 1 },
  playerStatsWinRatePie: { type: Object, default: null },
  playerStatsWinRateSummary: { type: Object, default: null },
  playerStatsBattleTimeline: { type: Array, default: () => [] },
  playerStatsTimelineChartModel: { type: Object, default: null },
  playerStatsDamageSharePie: { type: Object, default: null },
  playerStatsDamageSquadTotal: { type: Number, default: 0 },
  playerStatsPerHeroDamagePies: { type: Array, default: () => [] },
  playerStatsInjurySharePie: { type: Object, default: null },
  playerStatsInjurySquadTotal: { type: Number, default: 0 },
  playerStatsPerHeroInjuryPies: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'set-scale', 'reset'])

/** Component-local UI state (tabs, reset confirm, hover tooltips). */
const playerStatsModalTab = ref('summary')
const resetStatsConfirming = ref(false)
const statsTimelineHoverIdx = ref(null)
const statsTimelineHoverTipLeft = ref(0)
const statsTimelineHoverTipTop = ref(0)
const compPieHover = ref(null)

function classColor(heroClass) {
  return CLASS_COLORS[heroClass] ?? 'var(--text-muted)'
}

function setStatsDisplayScale(n) {
  emit('set-scale', n)
}

const statsTimelineTooltipLeftPx = computed(() => {
  const vw =
    typeof window !== 'undefined' && Number.isFinite(window.innerWidth) ? window.innerWidth : 800
  const half = 76
  const x = statsTimelineHoverTipLeft.value
  return Math.max(half, Math.min(x, vw - half))
})

const statsTimelineTooltipTopPx = computed(() => statsTimelineHoverTipTop.value)

const compPieTooltipLeftPx = computed(() => {
  const vw =
    typeof window !== 'undefined' && Number.isFinite(window.innerWidth) ? window.innerWidth : 800
  const half = 72
  const x = compPieHover.value?.left ?? 0
  return Math.max(half, Math.min(x, vw - half))
})

const compPieTooltipTopPx = computed(() => compPieHover.value?.top ?? 0)

function clearCompPieHover() {
  compPieHover.value = null
}

function onCompPieSliceHover(e, sl) {
  compPieHover.value = {
    label: sl.label,
    value: sl.value,
    pctLabel: sl.pctLabel,
    left: e.clientX,
    top: e.clientY,
  }
}

function onCompPieHoverMove(e) {
  if (!compPieHover.value) return
  compPieHover.value = {
    ...compPieHover.value,
    left: e.clientX,
    top: e.clientY,
  }
}

function onCompPieLegendHover(e, row, leg) {
  const sl = row.model.slices.find((s) => s.key === leg.key)
  if (!sl) return
  compPieHover.value = {
    label: sl.label,
    value: sl.value,
    pctLabel: sl.pctLabel,
    left: e.clientX,
    top: e.clientY,
  }
}

function onPlayerStatsChartMouseMove(e) {
  const shell = e.currentTarget
  const r = shell.getBoundingClientRect()
  const nw = Math.max(1, r.width)
  const list = playerStatsBattleTimeline
  const n = list.length
  if (n === 0) return
  const frac = (e.clientX - r.left) / nw
  let idx = n === 1 ? 0 : Math.round(frac * (n - 1))
  idx = Math.min(n - 1, Math.max(0, idx))
  statsTimelineHoverIdx.value = idx
  statsTimelineHoverTipLeft.value = e.clientX
  statsTimelineHoverTipTop.value = e.clientY
}

function clearPlayerStatsChartHover() {
  statsTimelineHoverIdx.value = null
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.78);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}
.player-stats-modal {
  width: min(92vw, 60rem);
  max-width: min(92vw, 60rem);
  max-height: 88vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.player-stats-modal-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 0.25rem;
}
.player-stats-modal-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border);
  margin-top: 0.5rem;
}
.player-stats-modal-tabs {
  margin-bottom: 0.45rem;
  flex-shrink: 0;
}
.player-stats-modal-body {
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
}
.player-stats-modal-footer {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  gap: 0.45rem;
  padding-top: 0.55rem;
  margin-top: 0.35rem;
  border-top: 1px solid var(--border-dark);
}
.player-stats-modal .player-stats-compact-btn {
  width: auto;
  flex: 0 0 auto;
  margin-top: 0;
  padding: 0.22rem 0.55rem;
  font-size: var(--font-xs);
  min-height: 0;
  line-height: 1.35;
}
.player-stats-modal-inline-btns {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 0.45rem;
  align-items: center;
  justify-content: flex-start;
}
.player-stats-timeline-empty {
  padding: 1rem 0.25rem;
  color: var(--text-muted);
  font-size: var(--font-sm);
  text-align: center;
}
.player-stats-damage-empty {
  padding: 1rem 0.35rem;
  color: var(--text-muted);
  font-size: var(--font-sm);
  text-align: center;
}
.player-stats-damage-layout {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}
.player-stats-damage-grid-title {
  font-size: var(--font-xs);
  font-weight: 600;
  color: var(--text-label);
  margin-top: 0.15rem;
}
.player-stats-damage-card {
  background: var(--bg-darker);
  border: 1px solid var(--border-dark);
  border-radius: 6px;
  padding: 0.55rem 0.65rem 0.65rem;
}
.player-stats-damage-card-wide {
  width: 100%;
  box-sizing: border-box;
}
.player-stats-damage-card-title {
  font-size: var(--font-xs);
  font-weight: 600;
  color: var(--text-label);
  margin-bottom: 0.45rem;
}
.player-stats-damage-mini-empty {
  font-size: var(--font-xs);
  color: var(--text-muted);
  padding: 0.35rem 0;
}
.player-stats-damage-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
  gap: 0.55rem;
}
.player-stats-pie-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
}
.player-stats-pie-row-compact {
  gap: 0.45rem;
}
.player-stats-pie-svg {
  flex-shrink: 0;
  width: 10rem;
  height: 10rem;
  max-width: 42vw;
}
.player-stats-pie-svg-compact {
  width: 7rem;
  height: 7rem;
  max-width: 38vw;
}
.player-stats-pie-slice {
  stroke: var(--bg-darker);
  stroke-width: 1px;
}
.player-stats-pie-hole-fallback {
  opacity: 0.85;
}
.player-stats-pie-legend {
  list-style: none;
  margin: 0;
  padding: 0;
  flex: 1;
  min-width: 9rem;
  font-size: var(--font-xs);
  color: var(--text-label);
}
.player-stats-pie-legend-compact {
  min-width: 7rem;
}
.player-stats-pie-legend-skill-only li {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.35rem 0.45rem;
  align-items: center;
  margin-bottom: 0.35rem;
}
.player-stats-pie-slice-hoverable {
  cursor: default;
}
.player-stats-comp-pie-pct {
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}
.player-stats-chart-tooltip .tip-val-dmg {
  color: var(--text-value);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.player-stats-pie-legend li {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  gap: 0.35rem 0.45rem;
  align-items: center;
  margin-bottom: 0.35rem;
}
.player-stats-pie-legend li:last-child {
  margin-bottom: 0;
}
.player-stats-legend-swatch {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 2px;
  flex-shrink: 0;
}
.player-stats-legend-name {
  font-weight: 500;
  color: var(--text-value);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.player-stats-legend-val {
  font-variant-numeric: tabular-nums;
  color: var(--text-value);
  text-align: right;
}
.player-stats-legend-pct {
  font-variant-numeric: tabular-nums;
  color: var(--text-muted);
  min-width: 2.25rem;
  text-align: right;
}
.player-stats-chart-shell {
  position: relative;
  background: var(--bg-darker);
  border: 1px solid var(--border-dark);
  border-radius: 6px;
  padding: 0.45rem 0.5rem 0.55rem;
}
.player-stats-chart-tooltip {
  position: absolute;
  z-index: 3;
  pointer-events: none;
  transform: translate(-50%, calc(-100% - 10px));
  min-width: 8.5rem;
  padding: 0.45rem 0.55rem;
  background: var(--tooltip-bg);
  border: 1px solid var(--tooltip-border);
  border-radius: var(--tooltip-radius);
  box-shadow: var(--tooltip-shadow);
  font-size: var(--font-xs);
  color: var(--text-label);
  line-height: 1.45;
}
.player-stats-chart-tooltip-floating {
  position: fixed;
  z-index: 220;
}
.player-stats-chart-tooltip-title {
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.25rem;
  font-size: var(--font-xs);
}
.player-stats-chart-tooltip .tip-val-steps {
  color: var(--color-mp);
  font-weight: 600;
}
.player-stats-chart-tooltip .tip-val-gold {
  color: var(--color-gold);
  font-weight: 600;
}
.player-stats-chart-tooltip .tip-val-xp {
  color: var(--color-magic);
  font-weight: 600;
}
.player-stats-svg-legend-label {
  font-size: 11px;
  font-family: inherit;
}
.legend-svg-steps {
  fill: var(--color-mp);
}
.legend-svg-gold {
  fill: var(--color-gold);
}
.legend-svg-xp {
  fill: var(--color-magic);
}
.player-stats-trend-svg {
  display: block;
  width: 100%;
  height: auto;
  max-height: 18rem;
  min-height: 14rem;
}
.player-stats-grid-line {
  stroke: var(--border-subtle);
  stroke-width: 1;
  stroke-dasharray: 4 4;
}
.player-stats-grid-line-v {
  stroke-dasharray: 3 5;
}
.player-stats-axis-label {
  fill: var(--text-muted);
  font-size: 11px;
  font-family: inherit;
}
.player-stats-axis-y-num {
  font-size: 11px;
}
.player-stats-axis-x {
  font-size: 11px;
}
.player-stats-axis-title-x {
  fill: var(--text-label);
  font-size: 11px;
  font-family: inherit;
}
.player-stats-line-gold {
  fill: none;
  stroke: var(--color-gold);
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 7 5;
}
.player-stats-line-xp {
  fill: none;
  stroke: var(--color-magic);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.player-stats-point-marker {
  stroke: var(--bg-dark);
  stroke-width: 1;
}
.player-stats-point-marker.marker-steps {
  fill: var(--color-mp);
}
.player-stats-point-marker.marker-gold {
  fill: var(--color-gold);
}
.player-stats-point-marker.marker-xp {
  fill: var(--color-magic);
}
.player-stats-chart-grid-bg {
  fill: var(--bg-dark);
  stroke: var(--border-dark);
  stroke-width: 1;
}
.player-stats-line-steps {
  fill: none;
  stroke: var(--color-mp);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.player-stats-banner p {
  margin: 0 0 0.5rem;
  color: var(--text-muted);
  font-size: var(--font-sm);
  line-height: 1.45;
}
.player-stats-banner p:last-child {
  margin-bottom: 0;
}
.player-stats-banner .val-gold {
  color: var(--color-gold);
}
.player-stats-banner .val-victory {
  color: var(--color-victory);
}
.player-stats-win-rate-card {
  margin-top: 0.55rem;
}
.player-stats-win-rate-summary {
  margin: 0 0 0.55rem;
  font-size: var(--font-sm);
  color: var(--text-muted);
  line-height: 1.45;
}
.player-stats-win-rate-summary strong {
  color: var(--text-value);
  font-weight: 600;
}
.player-stats-win-rate-summary .val-victory {
  color: var(--color-victory);
}
.player-stats-banner .val-exp {
  color: var(--color-exp);
}
.btn-scale {
  margin-right: 0.35rem;
  padding: 0.2rem 0.45rem;
  font-size: var(--font-xs);
  border: 1px solid var(--border);
  background: var(--bg-dark);
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 4px;
}
.btn-scale.active {
  border-color: var(--accent);
  color: var(--text-value);
}
.player-stats-actions {
  margin: 0.5rem 0;
}
.player-stats-reset-confirm .player-stats-reset-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}
</style>
