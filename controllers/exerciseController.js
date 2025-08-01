
import { Exercise } from '../config/database.js';

exports.getAllExercises = async (req, res) => {
  try {
    const exercises = await Exercise.findAll();
    res.status(200).json({ success: true, data: exercises });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch exercises', error: err.message });
  }
};

exports.createExercise = async (req, res) => {
  try {
    const exercise = await Exercise.create(req.body);
    res.status(201).json({ success: true, data: exercise });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Failed to create exercise', error: err.message });
  }
};

exports.updateExercise = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Exercise.update(req.body, { where: { id } });
    if (updated) {
      const updatedExercise = await Exercise.findByPk(id);
      res.status(200).json({ success: true, data: updatedExercise });
    } else {
      res.status(404).json({ success: false, message: 'Exercise not found' });
    }
  } catch (err) {
    res.status(400).json({ success: false, message: 'Failed to update exercise', error: err.message });
  }
};

exports.deleteExercise = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Exercise.destroy({ where: { id } });
    if (deleted) {
      res.status(200).json({ success: true, message: 'Exercise deleted' });
    } else {
      res.status(404).json({ success: false, message: 'Exercise not found' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete exercise', error: err.message });
  }
};