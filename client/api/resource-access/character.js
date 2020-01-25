//----------------------------------------------------------------------------------------------------------------------
// CharacterResourceAccess
//----------------------------------------------------------------------------------------------------------------------

import _ from 'lodash';
import $http from 'axios';

// Managers
import sysMan from '../managers/systems';

// Models
import CharacterModel from '../models/character';

//----------------------------------------------------------------------------------------------------------------------

class CharacterResourceAccess
{
    constructor()
    {
        this.$characters = {};
    } // end constructor

    _buildModel(def)
    {
        let character = this.$characters[def.id];
        if(character)
        {
            character.update(def);
        }
        else
        {
            const system = _.find(sysMan.systems, { id: def.system }) || { defaults: {} };
            character = new CharacterModel(def, system.defaults);
            this.$characters[def.id] = character;
        } // end if

        return character;
    } // end _buildModel

    async newCharacter(charDef)
    {
        return this._buildModel(charDef);
    } // end newCharacter

    async updateSysDefaults(char)
    {
        const system = _.find(sysMan.systems, { id: char.system }) || { defaults: {} };
        char._sysDefaults = system.defaults;
        char.update(Object.assign(char.toJSON(), { details: undefined }));

        return char;
    } // end updateSysDefaults

    async getCharacter(charID)
    {
        const { data } = await $http.get(`/characters/${ charID }`);
        return this._buildModel(data);
    } // end getCharacter

    async getAllCharacters(owner)
    {
        const { data } = await $http.get('/characters', { params: { owner, details: true } });
        return data.map((def) => this._buildModel(def));
    } // end getAllCharacters

    async saveCharacter(character)
    {
        const verb = character.id ? 'patch' : 'post';
        const charURL = character.id ? `/characters/${ character.id }` : `/characters`;
        const { data } = await ($http[verb](charURL, character)
            .catch((error) =>
            {
                // We always print the error, and revert.
                console.error('Failed to save character:', error);
                character.revert();

                // Rethrow, so other logic can handle the failure correctly.
                throw error;
            }));

        if(!character.id)
        {
            this.$characters[data.id] = character;
        } // end if

        return this._buildModel(data);
    } // end saveCharacter

    async deleteCharacter(character)
    {
        $http.delete(`/characters/${ character.id }`);
    } // end deleteCharacter
} // end CharacterResourceAccess

//----------------------------------------------------------------------------------------------------------------------

export default new CharacterResourceAccess();

//----------------------------------------------------------------------------------------------------------------------