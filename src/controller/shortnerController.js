/* eslint-disable consistent-return */
/* eslint-disable class-methods-use-this */
import crypto from 'crypto';
import parser from 'ua-parser-js';
import ShortnerModel from '../model/ShortnerModel.js';

class ShortnerController {
  async index(request, response) {
    const shortners = await ShortnerModel.find();

    response.json({ items: shortners });
  }

  async getOne(request, response) {
    const { id } = request.params;
    try {
      const shortner = await ShortnerModel.findById(id);
      if (!shortner) {
        return response.status(404).json({ message: 'Shortner not found' });
      }

      response.json(shortner);
    } catch (error) {
      response.json(error);
    }
  }

  async remove(request, response) {
    const { id } = request.params;
    try {
      const shortner = await ShortnerModel.findById(id);
      if (!shortner) {
        return response.status(404).json({ message: 'Shortner not found' });
      }
      await shortner.remove();

      response.json({ message: 'Shortner Removed' });
    } catch (error) {
      response.json(error);
    }
  }

  async store(request, response) {
    const { link = '' } = request.body;

    if (!link.trim()) {
      return response.status(400).json({ message: 'Link is missing' });
    }

    const [hash] = crypto.randomUUID().split('-');

    const shortner = await ShortnerModel.create({
      link,
      hash,
      ownerId: request.loggedUser.id,
    });

    response.json({ message: 'Shortner Created', shortner });
  }

  async update(request, response) {
    const { id } = request.params;
    const { link = '' } = request.body;

    try {
      const shortner = await ShortnerModel.findByIdAndUpdate(id, { link }, { new: true });
      if (!shortner) {
        return response.status(404).json({ message: 'Shortner not found' });
      }

      response.json(shortner);
    } catch (error) {
      response.json(error);
    }
  }

  async redirect(request, response) {
    const { hash } = request.params;
    const shortner = await ShortnerModel.findOne({ hash });

    if (!shortner) {
      return response.redirect('/');
    }

    const metadata = {
      ip: request.ip,
      parser: parser(request.headers['user-agent']),
    };

    shortner.hits += 1;
    shortner.metadata = [...shortner.metadata, metadata];
    await shortner.save();
    response.redirect(shortner.link);
  }
}

export default ShortnerController;
