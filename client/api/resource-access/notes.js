//----------------------------------------------------------------------------------------------------------------------
// NotesResourceAccess
//----------------------------------------------------------------------------------------------------------------------

import $http from 'axios';

// Models
import NotesModel from '../models/note';
import PageModel from '../models/page';

//----------------------------------------------------------------------------------------------------------------------

class NotesResourceAccess
{
    constructor()
    {
        this.$notes = {};
        this.$pages = {};
    } // end constructor

    //------------------------------------------------------------------------------------------------------------------

    _buildPage(def)
    {
        let page = this.$pages[def.page_id];
        if(page)
        {
            page.update(def);
        }
        else
        {
            page = new PageModel(def);
            this.$pages[def.page_id] = page;
        } // end if

        return page;
    } // end _buildPage

    _buildModel(def)
    {
        // Build pages first
        def.pages = def.pages.map((page) => this._buildPage(page));

        // Build note second
        let note = this.$notes[def.id];
        if(note)
        {
            note.update(def);
        }
        else
        {
            note = new NotesModel(def);
            this.$notes[def.id] = note;
        } // end if

        return note;
    } // end _buildModel

    //------------------------------------------------------------------------------------------------------------------

    async getNotes(noteID)
    {
        const { data } = await $http.get(`/notes/${ noteID }`);
        return this._buildModel(data);
    } // end getNotes

    async addPage(noteID, page)
    {
        const { data } = await $http.post(`/notes/${ noteID }/pages`, page);
        return this._buildPage(data);
    } // end addPage

    async updatePage(noteID, page)
    {
        const { data } = await $http.patch(`/notes/${ noteID }/pages/${ page.id }`, page);
        return this._buildPage(data);
    } // end updatePage

    async deletePage(noteID, page)
    {
        await $http.delete(`/notes/${ noteID }/pages/${ page.id }`);
        delete this.$pages[page.id];
    } // end deletePage

    async unloadNote(noteID)
    {
        const note = this.$notes[noteID];

        // Remove the note's pages from our cache
        note.pages.forEach((page) =>
        {
            delete this.$pages[page.id];
        });

        // Remove the cache note.
        delete this.$notes[noteID];
    } // end unloadNote
} // end NotesResourceAccess

//----------------------------------------------------------------------------------------------------------------------

export default new NotesResourceAccess();

//----------------------------------------------------------------------------------------------------------------------
