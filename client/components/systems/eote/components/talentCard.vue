<!----------------------------------------------------------------------------------------------------------------------
  -- talentCard
  --------------------------------------------------------------------------------------------------------------------->

<template>
    <b-card v-if="talent && talentBase" :id="id" class="eote-talent-card" no-body>
        <template v-slot:header>
            <b-btn-close v-if="!readonly" style="margin-top: -2px;" @click.stop.prevent="remove"></b-btn-close>
            <b-btn-close v-if="!readonly" class="mr-1" style="margin-top: 5px; font-size: 0.9rem" @click.stop.prevent="edit">
                <fa icon="edit"></fa>
            </b-btn-close>
            {{ talentBase.name }}
            <span v-if="talentBase.ranked">{{ talent.rank }}</span>
            <span v-if="mode === 'genesys'">
                (Tier {{ talent.tier }})
            </span>

            <b-popover :target="id" triggers="hover" placement="top">
                <template v-slot:title>
                    <div :class="`${ mode }-system`">
                        {{ talentBase.name }}
                        <span v-if="talentBase.ranked">{{ talent.rank }}</span>
                        <span v-if="mode === 'genesys'">
                            (Tier {{ talent.tier }})
                        </span>
                    </div>
                </template>
                <div :class="`${ mode }-system`">
                    <div>
                        <i>{{ activation }}</i>
                    </div>
                    <markdown-block :text="talentBase.description" inline></markdown-block>
                    <div class="clearfix">
                        <reference class="float-right mt-2 mb-2" :reference="talentBase.reference"></reference>
                    </div>
                    <div v-if="talent.notes">
                        <hr class="mt-1 mb-1" />
                        <markdown-block :text="talent.notes" inline></markdown-block>
                    </div>
                </div>
            </b-popover>
        </template>
    </b-card>
</template>

<!--------------------------------------------------------------------------------------------------------------------->

<style lang="scss" scoped>
    .eote-talent-card {
        .card-header {
            border-bottom: none;
            cursor: pointer;
            padding: 0.25rem 0.5rem;
        }
    }
</style>

<!--------------------------------------------------------------------------------------------------------------------->

<script>
    //------------------------------------------------------------------------------------------------------------------

    import { v4 } from 'uuid';

    // Managers
    import eoteMan from '../../../../api/managers/eote';

    // Components
    import MarkdownBlock from '../../../ui/markdown';
    import Reference from './reference.vue';

    //------------------------------------------------------------------------------------------------------------------

    export default {
        name: 'EotETalentCard',
        components: {
            MarkdownBlock,
            Reference
        },
        props: {
            talent: {
                type: Object,
                required: true
            },
            readonly: {
                type: Boolean,
                default: false
            }
        },
        subscriptions: {
            talents: eoteMan.talents$,
            mode: eoteMan.mode$
        },
        data()
        {
            return {
                uuid: v4()
            };
        },
        computed: {
            id() { return `talent-${ this.uuid }`; },
            talentBase()
            {
                if(this.talent && this.talent.id)
                {
                    return this.talents.find((talent) => talent.id === this.talent.id);
                } // end if

                return {};
            },
            activation()
            {
                if(this.talentBase.name)
                {
                    return eoteMan.activationEnum[this.talentBase.activation];
                } // end if

                return '';
            }
        },
        methods: {
            edit()
            {
                if(!this.readonly)
                {
                    this.$emit('edit', this.talent.title);
                } // end if
            },
            remove()
            {
                if(!this.readonly)
                {
                    this.$emit('remove', this.talent.title);
                } // end if
            }
        }
    };
</script>

<!--------------------------------------------------------------------------------------------------------------------->
